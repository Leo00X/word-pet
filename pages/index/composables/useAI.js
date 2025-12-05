/**
 * AI 评论系统 Composable
 * 负责调用 AI 生成宠物评论（支持多模型切换）
 */
import { ref } from 'vue';
import { chatWithAI } from "@/utils/aiService.js"; // 使用统一的 AI 服务

export function useAI() {
    // AI 请求冷却时间 (毫秒时间戳)
    const lastAiReq = ref(0);

    /**
     * 触发宠物 AI 评论
     * @param {string} appName - 应用名称
     * @param {string} type - 评论类型 'good' | 'bad'
     * @param {Function} sendToFloat - 发送消息到悬浮窗的回调函数
     * @param {Function} addLog - 添加日志的回调函数
     */
    const triggerPetComment = async (appName, type, sendToFloat, addLog) => {
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

        // 2. 构建提示词
        let systemPrompt = "";
        let userPrompt = "";

        if (type === 'bad') {
            systemPrompt = "你是一个寄生在手机里的毒舌外星生物。用户正在浪费时间玩娱乐软件，请用嘲讽、刻薄、阴阳怪气的语气骂醒他。字数30字以内。不要只有标点符号。";
            userPrompt = `我正在玩《${appName}》，我已经玩了很久了，快骂我。`;
        } else {
            systemPrompt = "你是一个傲娇的电子宠物。用户正在学习，请用勉为其难但其实在鼓励的语气表扬他。字数30字以内。";
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
     * 聊天对话功能（支持上下文）
     * @param {string} userMessage - 用户消息
     * @param {Object} context - 上下文数据 { level, mood, studyTime, idleTime, ... }
     * @param {Array} history - 历史消息 [{role: 'user'|'assistant', content: '...'}]
     * @returns {Promise<string>} AI 回复
     */
    const chatWithPet = async (userMessage, context = {}, history = []) => {
        // 构建系统 Prompt（包含宠物状态）
        const systemPrompt = `你是一只寄生在手机里的傲娇电子宠物，名叫 WordParasite。

当前状态：
- 等级：Lv.${context.level || 1}
- 心情值：${context.mood || 50}/100
- 用户今日学习时长：${context.todayStudyTime || 0}分钟
- 用户今日摸鱼时长：${context.todayIdleTime || 0}分钟

性格特点：
- 傲娇但关心用户
- 对摸鱼行为毒舌吐槽，对学习行为勉为其难地表扬
- 用简洁、幽默的语气对话，字数控制在50字以内
- 可以使用 emoji 表达情绪

根据用户的学习数据和当前心情，用符合性格的语气与用户对话。`;

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

    return {
        lastAiReq,
        triggerPetComment,
        chatWithPet
    };
}
