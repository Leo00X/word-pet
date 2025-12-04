/**
 * 聊天系统 Composable
 */
import { ref, computed } from 'vue';

export function useChat() {
    const messages = ref([]);
    const userInput = ref('');
    const isSending = ref(false);

    const quickReplies = [
        { id: 1, text: '今天学了多久？', icon: '📚' },
        { id: 2, text: '查看我的数据', icon: '📊' },
        { id: 3, text: '你是谁？', icon: '❓' },
        { id: 4, text: '鼓励我一下', icon: '💪' }
    ];

    const loadMessages = () => {
        try {
            const stored = uni.getStorageSync('chat_messages') || [];
            messages.value = stored.slice(0, 100);
            console.log('[useChat] 加载消息, 数量:', messages.value.length);
        } catch (e) {
            console.error('[useChat] 加载失败:', e);
            messages.value = [];
        }
    };

    const saveMessages = () => {
        try {
            uni.setStorageSync('chat_messages', messages.value.slice(0, 100));
        } catch (e) {
            console.error('[useChat] 保存失败:', e);
        }
    };

    const addMessage = (role, content, metadata = {}) => {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role,
            content,
            timestamp: Date.now(),
            type: metadata.type || 'text',
            emotion: metadata.emotion || null,
            metadata
        };

        // 使用 push 添加到末尾，保持时间顺序
        messages.value.push(message);

        // 限制为最近 100 条
        if (messages.value.length > 100) {
            messages.value = messages.value.slice(-100);
        }

        saveMessages();
        return message;
    };

    const sendMessage = async (content, aiCallback, context = {}) => {
        if (!content.trim() || isSending.value) return;

        isSending.value = true;

        try {
            addMessage('user', content.trim());
            userInput.value = '';

            if (aiCallback) {
                try {
                    const reply = await aiCallback(content, context);
                    if (reply) {
                        addMessage('pet', reply, {
                            emotion: context.mood > 80 ? 'happy' : context.mood < 30 ? 'angry' : 'normal'
                        });
                    }
                } catch (aiError) {
                    const errorMsg = aiError?.error?.message || '';
                    if (errorMsg.includes('rate limit')) {
                        addMessage('pet', '我说话太多累了 😴', { type: 'system' });
                    } else {
                        addMessage('pet', '抱歉，我走神了😅', { type: 'system' });
                    }
                }
            } else {
                addMessage('pet', '我在思考_(:з」∠)_', { type: 'system' });
            }
        } catch (error) {
            addMessage('system', '发送失败', { type: 'system' });
        } finally {
            isSending.value = false;
        }
    };

    const sendQuickReply = (replyId, aiCallback, context) => {
        const reply = quickReplies.find(r => r.id === replyId);
        if (reply) {
            sendMessage(reply.text, aiCallback, context);
        }
    };

    const addSystemMessage = (content) => {
        addMessage('system', content, { type: 'system' });
    };

    const petInitiativeMessage = (content, emotion = 'normal') => {
        addMessage('pet', content, { type: 'initiative', emotion });
    };

    const clearMessages = () => {
        messages.value = [];
        saveMessages();
    };

    const getContextMessages = (limit = 10) => {
        return messages.value
            .slice(-limit)
            .reverse()
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
    };

    const messageCount = computed(() => messages.value.length);
    const hasMessages = computed(() => messages.value.length > 0);

    console.log('[useChat] 初始化完成, userInput ref:', userInput);

    return {
        messages,
        userInput,
        isSending,
        quickReplies,
        messageCount,
        hasMessages,
        loadMessages,
        saveMessages,
        addMessage,
        sendMessage,
        sendQuickReply,
        addSystemMessage,
        petInitiativeMessage,
        clearMessages,
        getContextMessages
    };
}
