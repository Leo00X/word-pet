/**
 * 聊天事件处理器 Composable
 * 职责: 处理聊天相关的用户交互事件
 * 
 * 从 index.vue 提取，遵循 Index净化协议
 */
import { logUserAction } from '@/utils/debugLog.js';

/**
 * 聊天事件处理器
 * @param {Object} deps - 依赖注入
 */
export function useChatHandlers(deps) {
    const {
        chat,
        ai,
        growth,
        onCheckAchievements  // 成就检查回调
    } = deps;

    /**
     * 构建聊天上下文
     */
    const buildContext = () => ({
        level: growth.petLevel.value,
        mood: growth.mood.value,
        todayStudyTime: growth.todayStudyTime.value,
        todayIdleTime: growth.todayIdleTime.value
    });

    /**
     * 构建聊天历史
     */
    const buildHistory = () => {
        return chat.messages.value
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
    };

    /**
     * AI 回复生成器
     */
    const generateAIReply = async (userMsg, ctx) => {
        try {
            const history = buildHistory();
            const reply = await ai.chatWithPet(userMsg, ctx, history);
            return reply;
        } catch (e) {
            return '嗯...让我想想 💭';
        }
    };

    /**
     * 处理用户输入更新
     */
    const handleUserInputUpdate = (value) => {
        if (chat.userInput) {
            chat.userInput.value = value;
        }
    };

    /**
     * 发送消息
     */
    const handleSendMessage = async (content) => {
        logUserAction('发送消息', { 内容: content.substring(0, 30) });

        const context = buildContext();

        await chat.sendMessage(content, generateAIReply, context);

        // 发送消息后检查成就
        if (onCheckAchievements) {
            onCheckAchievements();
        }
    };

    /**
     * 快捷回复
     */
    const handleQuickReply = async (replyId) => {
        logUserAction('点击快捷回复', { replyId });

        const context = buildContext();

        chat.sendQuickReply(replyId, generateAIReply, context);

        // 快捷回复后检查成就
        if (onCheckAchievements) {
            onCheckAchievements();
        }
    };

    return {
        handleUserInputUpdate,
        handleSendMessage,
        handleQuickReply,
        buildContext,
        buildHistory
    };
}
