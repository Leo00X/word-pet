/**
 * 随机 AI 互动 Composable
 * 职责: 管理宠物主动发起的随机对话，增强互动趣味性
 * 
 * 触发条件:
 * - 空闲触发: 5分钟无互动
 * - 随机触发: 每分钟 5% 概率
 * - 全局冷却: 2分钟
 * 
 * @author WordParasite Team
 * @version 1.0.0
 * @date 2025-12-07
 */
import { ref, computed } from 'vue';
import { chatWithAI } from '@/utils/aiService.js';
import { debugLog } from '@/utils/debugLog.js';

// ========== 话题池 ==========
const RANDOM_TOPICS = [
    // 日常类
    { id: 'bored', prompt: '你觉得有点无聊，想找主人聊天', emotion: 'bored' },
    { id: 'curious', prompt: '你对主人最近在做什么感到好奇', emotion: 'curious' },
    { id: 'care', prompt: '你担心主人学习太累了，想关心一下', emotion: 'care' },
    { id: 'hungry', prompt: '你有点饿了，想提醒主人也该休息了', emotion: 'hungry' },

    // 傲娇类
    { id: 'brag', prompt: '你想炫耀一下自己的等级和能力', emotion: 'proud' },
    { id: 'tease', prompt: '你想调侃主人之前摸鱼的事', emotion: 'playful' },
    { id: 'tsundere', prompt: '你想关心主人但要用傲娇的方式表达', emotion: 'tsundere' },

    // 互动类
    { id: 'question', prompt: '你想问主人一个有趣的问题', emotion: 'curious' },
    { id: 'share', prompt: '你想分享一个今天观察到的有趣事情', emotion: 'excited' },
    { id: 'complain', prompt: '你想抱怨一下自己作为电子宠物的日常', emotion: 'grumpy' },

    // 鼓励类
    { id: 'cheer', prompt: '你想给主人加油打气', emotion: 'supportive' },
    { id: 'praise', prompt: '你想夸奖主人最近的努力', emotion: 'proud' }
];

// ========== 配置常量 ==========
const DEFAULT_CONFIG = {
    globalCooldown: 2 * 60 * 1000,      // 2分钟全局冷却
    idleThreshold: 5 * 60 * 1000,       // 5分钟空闲触发
    randomChance: 0.05,                  // 5% 随机概率 (每分钟)
    maxTextLength: 30,                   // 最大文本长度
    maxHistoryCount: 50                  // 最大历史记录数
};

// 存储 Key
const STORAGE_KEYS = {
    ENABLED: 'random_chat_enabled',
    HISTORY: 'random_chat_history'
};

// ========== Composable ==========
export function useRandomChat(options = {}) {
    const {
        growthInstance = null,       // 成长系统实例
        sendToFloat = null,          // 发送到悬浮窗回调
        addToChatPanel = null,       // 添加到聊天面板回调
        addLog = null                // 日志回调
    } = options;

    // ========== 响应式状态 ==========
    const enabled = ref(true);
    const lastTriggerTime = ref(0);
    const lastInteractionTime = ref(Date.now());
    const triggerCount = ref(0);
    const lastTopic = ref(null);
    const chatHistory = ref([]);  // AI 话语历史记录

    // ========== 计算属性 ==========
    const canTrigger = computed(() => {
        const now = Date.now();
        return enabled.value && (now - lastTriggerTime.value > DEFAULT_CONFIG.globalCooldown);
    });

    const idleTime = computed(() => {
        return Date.now() - lastInteractionTime.value;
    });

    // ========== 数据持久化 ==========

    /**
     * 加载设置和历史记录
     */
    const loadData = () => {
        try {
            // 加载开关状态
            const savedEnabled = uni.getStorageSync(STORAGE_KEYS.ENABLED);
            if (savedEnabled !== '') {
                enabled.value = savedEnabled;
            }

            // 加载历史记录
            const savedHistory = uni.getStorageSync(STORAGE_KEYS.HISTORY);
            if (savedHistory && Array.isArray(savedHistory)) {
                chatHistory.value = savedHistory;
            }

            debugLog('[RandomChat] 数据加载完成:', { enabled: enabled.value, historyCount: chatHistory.value.length });
        } catch (e) {
            debugLog('[RandomChat] 数据加载失败:', e);
        }
    };

    /**
     * 保存开关状态
     */
    const saveEnabled = () => {
        try {
            uni.setStorageSync(STORAGE_KEYS.ENABLED, enabled.value);
        } catch (e) {
            debugLog('[RandomChat] 保存开关失败:', e);
        }
    };

    /**
     * 保存历史记录
     */
    const saveHistory = () => {
        try {
            // 只保存最近 N 条
            const trimmed = chatHistory.value.slice(-DEFAULT_CONFIG.maxHistoryCount);
            uni.setStorageSync(STORAGE_KEYS.HISTORY, trimmed);
        } catch (e) {
            debugLog('[RandomChat] 保存历史失败:', e);
        }
    };

    /**
     * 添加一条 AI 话语到历史
     */
    const addToHistory = (reply, topic, reason) => {
        const record = {
            id: Date.now(),
            text: reply,
            topic: topic.id,
            emotion: topic.emotion,
            reason: reason,
            timestamp: Date.now()
        };
        chatHistory.value.push(record);
        saveHistory();
        debugLog('[RandomChat] 已保存到历史:', record);
    };

    /**
     * 清空历史记录
     */
    const clearHistory = () => {
        chatHistory.value = [];
        saveHistory();
        debugLog('[RandomChat] 历史已清空');
    };

    // ========== 核心方法 ==========

    /**
     * 记录用户互动时间
     * 应在手势识别、聊天发送等用户主动操作时调用
     */
    const recordInteraction = () => {
        lastInteractionTime.value = Date.now();
        debugLog('[RandomChat] 记录互动时间');
    };

    /**
     * 尝试触发随机互动
     * 由 tick 定时器调用，检查是否满足触发条件
     */
    const tryTriggerRandomChat = async () => {
        if (!canTrigger.value) {
            return false;
        }

        const now = Date.now();
        const currentIdleTime = now - lastInteractionTime.value;
        let shouldTrigger = false;
        let triggerReason = '';

        // 1. 空闲触发 (优先级最高)
        if (currentIdleTime > DEFAULT_CONFIG.idleThreshold) {
            shouldTrigger = true;
            triggerReason = 'idle';
            debugLog('[RandomChat] 空闲触发检测通过');
        }
        // 2. 随机触发
        else if (Math.random() < DEFAULT_CONFIG.randomChance) {
            shouldTrigger = true;
            triggerReason = 'random';
            debugLog('[RandomChat] 随机触发检测通过');
        }

        if (shouldTrigger) {
            await triggerChat(triggerReason);
            return true;
        }

        return false;
    };

    /**
     * 执行随机聊天
     * @param {string} reason - 触发原因 'idle' | 'random' | 'test'
     */
    const triggerChat = async (reason = 'random') => {
        // 选择随机话题 (避免重复)
        let topic;
        let attempts = 0;
        do {
            topic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
            attempts++;
        } while (topic.id === lastTopic.value?.id && attempts < 3);

        lastTopic.value = topic;

        // 构建上下文
        const context = {
            level: growthInstance?.petLevel?.value || 1,
            mood: growthInstance?.mood?.value || 50,
            studyTime: growthInstance?.todayStudyTime?.value || 0,
            idleTime: growthInstance?.todayIdleTime?.value || 0,
            hunger: growthInstance?.hunger?.value || 100
        };

        // 构建 AI Prompt
        const systemPrompt = buildSystemPrompt(topic, context);

        debugLog('[RandomChat] 准备触发:', { reason, topic: topic.id, context });

        try {
            // 调用 AI
            const reply = await chatWithAI('', systemPrompt);

            // 截断过长内容
            const truncatedReply = reply.slice(0, DEFAULT_CONFIG.maxTextLength);

            // 发送到悬浮窗 (消息类型 1 = 普通消息)
            if (sendToFloat) {
                sendToFloat(1, truncatedReply);
            }

            // 添加到聊天面板
            if (addToChatPanel) {
                addToChatPanel(truncatedReply, topic.emotion);
            }

            // 更新状态
            lastTriggerTime.value = Date.now();
            triggerCount.value++;

            // 记录日志
            if (addLog) {
                addLog(`🎲 宠物主动说话 [${reason}]: ${truncatedReply}`);
            }

            debugLog('[RandomChat] 触发成功:', truncatedReply);

            // 保存到历史记录
            addToHistory(truncatedReply, topic, reason);

            return true;

        } catch (error) {
            debugLog('[RandomChat] AI 调用失败:', error);

            // 失败时使用本地兜底
            const fallbackReply = getLocalFallback(topic.emotion, context.mood);

            if (sendToFloat) {
                sendToFloat(1, fallbackReply);
            }
            if (addToChatPanel) {
                addToChatPanel(fallbackReply, topic.emotion);
            }

            lastTriggerTime.value = Date.now();
            return false;
        }
    };

    /**
     * 构建系统 Prompt
     */
    const buildSystemPrompt = (topic, context) => {
        const moodDesc = context.mood > 70 ? '心情很好' :
            context.mood > 40 ? '心情一般' : '心情不太好';
        const hungerDesc = context.hunger < 30 ? '有点饿了' : '';

        return `你是一只傲娇的电子宠物 WordParasite。
${topic.prompt}。

当前状态:
- 等级: Lv.${context.level}
- ${moodDesc} (${context.mood}/100)
- 主人今日学习${context.studyTime}分钟
${hungerDesc ? `- ${hungerDesc}` : ''}

回复要求:
- 用简短傲娇的语气说话
- 字数严格控制在20字以内
- 可以用 emoji 表达情绪
- 不要用引号包裹`;
    };

    /**
     * 本地兜底响应
     */
    const getLocalFallback = (emotion, mood) => {
        const fallbacks = {
            bored: ['好无聊啊...', '有人在吗？👀', '喂，理我一下嘛'],
            curious: ['在干嘛呢？', '让我看看~', '好奇ing...'],
            care: ['休息一下吧', '别太累了哦', '要不要喝杯水？'],
            proud: ['看我多厉害！', '哼，一般般啦', '本宝宝最棒！'],
            playful: ['嘿嘿~', '被我发现了吧', '抓到你了！'],
            tsundere: ['才、才没有想你！', '哼~', '不是特意来的...'],
            default: ['...', '嗯？', '有事吗？']
        };

        const pool = fallbacks[emotion] || fallbacks.default;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    // ========== 控制方法 ==========

    /**
     * 启用随机互动
     */
    const enable = () => {
        enabled.value = true;
        saveEnabled();
        debugLog('[RandomChat] 已启用');
    };

    /**
     * 禁用随机互动
     */
    const disable = () => {
        enabled.value = false;
        saveEnabled();
        debugLog('[RandomChat] 已禁用');
    };

    /**
     * 切换启用状态
     */
    const toggle = () => {
        enabled.value = !enabled.value;
        saveEnabled();
        debugLog('[RandomChat] 切换为:', enabled.value ? '启用' : '禁用');
    };

    /**
     * 获取统计信息
     */
    const getStats = () => ({
        enabled: enabled.value,
        triggerCount: triggerCount.value,
        lastTriggerTime: lastTriggerTime.value,
        idleTime: idleTime.value,
        lastTopic: lastTopic.value?.id || null,
        historyCount: chatHistory.value.length
    });

    // ========== 返回 ==========
    return {
        // 状态
        enabled,
        triggerCount,
        lastTopic,
        chatHistory,
        // 计算属性
        canTrigger,
        idleTime,
        // 数据方法
        loadData,
        clearHistory,
        // 核心方法
        recordInteraction,
        tryTriggerRandomChat,
        triggerChat,
        // 控制方法
        enable,
        disable,
        toggle,
        getStats,
        // 常量 (供测试使用)
        RANDOM_TOPICS
    };
}
