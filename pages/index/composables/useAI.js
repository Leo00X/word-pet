/**
 * AI 评论系统 Composable
 * 负责调用 DeepSeek AI 生成宠物评论
 */
import { ref } from 'vue';
import { chatWithAI } from "@/utils/deepseek.js";

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
        if (addLog) addLog("🤖 正在请求 DeepSeek 评价...");

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

    return {
        lastAiReq,
        triggerPetComment
    };
}
