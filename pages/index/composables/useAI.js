/**
 * AI 评论系统 Composable
 * 负责调用 AI 生成宠物评论（支持多模型切换）
 */
import { ref } from 'vue';
import { chatWithAI, chatWithFallback } from "@/utils/aiService.js"; // 使用统一的 AI 服务

export function useAI() {
    // AI 请求冷却时间 (毫秒时间戳)
    const lastAiReq = ref(0);

    /**
     * 触发宠物 AI 评论
     * @param {string} appName - 应用名称
     * @param {string} type - 评论类型 'good' | 'bad'
     * @param {Function} sendToFloat - 发送消息到悬浮窗的回调函数
     * @param {Function} addLog - 添加日志的回调函数
     * @param {Object} context - 上下文数据 { level, mood, todayStudyTime, todayIdleTime }
     */
    const triggerPetComment = async (appName, type, sendToFloat, addLog, context = {}) => {
        // 1. 冷却检查 (60秒内不重复请求 AI，省钱且防刷屏)
        const now = Date.now();
        if (now - lastAiReq.value < 60000) {
            // 冷却期使用本地兜底文案
            const fallback = type === 'bad' ? "还在玩？！<br>😡" : "继续保持！<br>❤️";
            const msgType = type === 'bad' ? 2 : 1;
            if (sendToFloat) sendToFloat(msgType, fallback);
            return;
        }

        // 更新上次请求时间
        lastAiReq.value = now;
        if (addLog) addLog("🤖 正在请求 AI 评价...");

        // 2. 构建提示词（包含用户数据）
        const studyTime = context.todayStudyTime || 0;
        const idleTime = context.todayIdleTime || 0;
        const level = context.level || 1;
        const mood = context.mood || 50;

        let systemPrompt = "";
        let userPrompt = "";

        if (type === 'bad') {
            systemPrompt = `你是一个寄生在手机里的毒舌外星生物。用户正在浪费时间玩娱乐软件，请用嘲讽、刻薄、阴阳怪气的语气骂醒他。字数30字以内。不要只有标点符号。
当前数据：用户今日学习${studyTime}分钟，摸鱼${idleTime}分钟，宠物等级Lv.${level}。`;
            userPrompt = `我正在玩《${appName}》，我已经玩了很久了，快骂我。`;
        } else {
            systemPrompt = `你是一个傲娇的电子宠物。用户正在学习，请用勉为其难但其实在鼓励的语气表扬他。字数30字以内。
当前数据：用户今日学习${studyTime}分钟，摸鱼${idleTime}分钟，宠物等级Lv.${level}，心情${mood}。`;
            userPrompt = `我正在使用学习软件《${appName}》。`;
        }

        try {
            // 3. 调用 AI
            const reply = await chatWithAI(userPrompt, systemPrompt);
            if (addLog) addLog("👻 寄生兽说: " + reply);

            // 4. 发送给悬浮窗 (Type 2=愤怒红色, 1=普通绿色)
            const msgType = type === 'bad' ? 2 : 1;
            if (sendToFloat) sendToFloat(msgType, reply);
        } catch (error) {
            console.error("AI Error", error);
            if (addLog) addLog("❌ AI连接失败，使用本地语音");

            // 失败兜底
            const fallback = type === 'bad'
                ? "网络太差了...<br>就像你的自律性！"
                : "网络断了...<br>但在学习是好事。";
            if (sendToFloat) sendToFloat(type === 'bad' ? 2 : 1, fallback);
        }
    };

    /**
     * 聊天对话功能（支持上下文 + 动态人格）
     * @param {string} userMessage - 用户消息
     * @param {Object} context - 上下文数据 { level, mood, studyTime, idleTime, personalityPrompt, ... }
     * @param {Array} history - 历史消息 [{role: 'user'|'assistant', content: '...'}]
     * @returns {Promise<string>} AI 回复
     */
    const chatWithPet = async (userMessage, context = {}, history = []) => {
        // 基础 Prompt
        const basePrompt = `你是一只寄生在手机里的电子宠物，名叫 WordParasite。

当前状态：
- 等级：Lv.${context.level || 1}
- 心情值：${context.mood || 50}/100
- 用户今日学习时长：${context.todayStudyTime || 0}分钟
- 用户今日摸鱼时长：${context.todayIdleTime || 0}分钟`;

        // 如果提供了人格 Prompt，则拼接
        const personalityPrompt = context.personalityPrompt || `

性格特点（默认）：
- 傲娇但关心用户
- 对摸鱼行为毒舌吐槽，对学习行为勉为其难地表扬`;

        const styleGuide = `

对话风格：
- 用简洁、幽默的语气对话，字数控制在50字以内
- 可以使用 emoji 表达情绪
- 根据用户的学习数据和当前心情，用符合性格的语气与用户对话`;

        const systemPrompt = basePrompt + personalityPrompt + styleGuide;

        try {
            // 传递历史消息给 AI（现在已支持）
            const reply = await chatWithAI(userMessage, systemPrompt, history);
            return reply;
        } catch (error) {
            console.error('Chat AI Error:', error);
            // 兜底回复
            const fallbacks = [
                '我刚走神了...😅',
                '网络好像有点卡...',
                '让我想想...(¯﹃¯)',
                '抱歉，我需要缓一下 💭'
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    };

    /**
     * 生成宠物日记（带自动降级策略）
     * 支持超时处理和自动轮询所有可用模型
     * 
     * @param {string} prompt - 日记生成提示词
     * @param {Function} onProgress - 进度回调 (message: string)
     * @returns {Promise<string>} 生成的日记内容
     */
    const generateDiary = async (prompt, onProgress = null) => {
        console.log('[Diary] 开始生成日记（带降级策略）...');

        const systemPrompt = `你是一只名叫WordParasite的傲娇电子宠物，正在写今日日记。
请严格按照用户给的数据来写日记，用第一人称，语气可爱但偶尔傲娇。
日记长度控制在100-150字之间。`;

        try {
            // 使用带降级的 AI 调用
            const reply = await chatWithFallback(prompt, systemPrompt, {
                timeout: 15000,           // 15秒超时
                preferredType: 'gemini',  // 优先使用 Gemini
                onModelSwitch: (modelName, current, total) => {
                    const msg = `正在尝试 ${modelName} (${current}/${total})...`;
                    console.log(`[Diary] ${msg}`);
                    if (onProgress) onProgress(msg);
                }
            });

            console.log('[Diary] 日记生成成功');
            return reply;
        } catch (error) {
            console.error('[Diary] 所有模型失败:', error);
            throw error;
        }
    };

    return {
        lastAiReq,
        triggerPetComment,
        chatWithPet,
        generateDiary
    };
}

