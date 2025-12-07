/**
 * 聊天事件处理器 Composable
 * 职责: 处理聊天相关的用户交互事件
 * 
 * 从 index.vue 提取，遵循 Index净化协议
 * HCDS 集成：人格系统 + 记忆系统 + 反思系统
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
        personality,      // HCDS Phase 1: 人格系统
        memory,           // HCDS Phase 2: 记忆系统
        reflection,       // HCDS Phase 3: 反思系统
        vectorMemory,     // HCDS Phase 5: 向量记忆
        onCheckAchievements
    } = deps;

    /**
     * 构建聊天上下文（包含 HCDS 所有系统的 Prompt）
     */
    const buildContext = async (userMessage = '') => {
        const ctx = {
            level: growth.petLevel.value,
            mood: growth.mood.value,
            todayStudyTime: growth.todayStudyTime.value,
            todayIdleTime: growth.todayIdleTime.value
        };

        // HCDS Phase 1: 人格系统
        if (personality) {
            ctx.personalityPrompt = personality.buildPersonalityPrompt();
        }

        // HCDS Phase 2: 记忆系统（智能检索）
        if (memory && userMessage) {
            const relevantMemories = memory.smartSearch(userMessage, 3);
            if (relevantMemories.length > 0) {
                ctx.memoryPrompt = '# 相关记忆\n' + relevantMemories
                    .map(m => `- ${m.content} (${Math.round(m.score * 100)}%相关)`)
                    .join('\n');
            }
        }

        // HCDS Phase 3: 反思系统洞察
        if (reflection) {
            ctx.reflectionPrompt = reflection.buildReflectionPrompt();
        }

        // HCDS Phase 5: 向量语义检索（异步）
        if (vectorMemory && userMessage) {
            try {
                const semanticContext = await vectorMemory.buildSemanticContext(userMessage, 2);
                if (semanticContext) {
                    ctx.semanticPrompt = semanticContext;
                }
            } catch (e) {
                // 向量检索失败不影响主流程
            }
        }

        return ctx;
    };

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

        // 异步构建上下文（包含 HCDS 系统）
        const context = await buildContext(content);

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

        const reply = chat.quickReplies.value.find(r => r.id === replyId);
        const content = reply?.text || '';

        // 异步构建上下文
        const context = await buildContext(content);

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
