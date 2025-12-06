/**
 * AI 降级策略管理器 Composable
 * 职责: 管理 AI 请求的多级降级策略，确保用户体验连续性
 * 
 * 降级级别：
 * - Level 0: 完整 AI（带记忆和历史）
 * - Level 1: 压缩 AI（简化 Prompt）
 * - Level 2: 本地模板响应
 * - Level 3: 静态预设响应
 * 
 * 触发条件：
 * - 超时 → 降级
 * - 连续错误 → 降级
 * - 网络问题 → 直接到 Level 2
 */
import { ref, computed } from 'vue';
import { debugLog, logError } from '@/utils/debugLog.js';

// ========== 降级配置 ==========
const FALLBACK_CONFIG = {
    // 每级超时时间（毫秒）
    timeouts: {
        0: 8000,   // 完整 AI
        1: 5000,   // 压缩 AI
        2: 0,      // 本地模板（无网络）
        3: 0       // 静态响应
    },
    // 连续错误阈值
    errorThreshold: 3,
    // 降级冷却时间（毫秒）
    cooldownTime: 60000,
    // 自动恢复时间（毫秒）
    recoveryTime: 300000
};

// 本地模板响应库
const LOCAL_TEMPLATES = {
    TAP: {
        high: ['嘿嘿~', '怎么啦？', '在呢！', '想我了？💕'],
        mid: ['干嘛？', '嗯？', '有事？'],
        low: ['别戳了...', '心情不好...', '哼！💢']
    },
    DOUBLE_TAP: {
        high: ['双击打开菜单~', '来玩吗？🎮'],
        mid: ['要做什么？'],
        low: ['...有事？']
    },
    LONG_PRESS: {
        high: ['别按太久啦~', '痒痒的！😆'],
        mid: ['够了够了', '松开啦'],
        low: ['...松手', '不舒服']
    },
    THROW: {
        high: ['呜哇！别甩我！', '好晕～', '我会飞！🌪️'],
        mid: ['喂！', '小心点！'],
        low: ['...你是不是讨厌我', '😢']
    },
    SWIPE: {
        high: ['嘿！躲开～', '好快！⚡'],
        mid: ['干嘛滑我？'],
        low: ['别闹...']
    },
    GREETING: {
        high: ['早上好！今天也要加油哦！☀️', '嗨～想我了吗？'],
        mid: ['嗯...早', '又见面了'],
        low: ['...早']
    },
    STUDY_REWARD: {
        high: ['太棒了！继续保持！🎉', '好样的！奖励一个摸头～'],
        mid: ['还不错', '继续吧'],
        low: ['终于学了点...']
    },
    FISH_WARNING: {
        high: ['适当休息一下吧～', '玩够了吗？'],
        mid: ['该学习了...', '少玩一会儿'],
        low: ['又在摸鱼！💢', '去学习！']
    },
    default: {
        high: ['嘿嘿~', '💕'],
        mid: ['嗯？'],
        low: ['...']
    }
};

// 静态预设响应
const STATIC_RESPONSES = {
    happy: { text: '嘿嘿~', action: 'jump', emotion: 'happy', duration: 1000, bubbleColor: '#4CAF50' },
    neutral: { text: '...', action: 'idle', emotion: 'neutral', duration: 800, bubbleColor: '#9E9E9E' },
    sad: { text: '呜...', action: 'hide', emotion: 'sad', duration: 1500, bubbleColor: '#2196F3' },
    angry: { text: '哼！', action: 'shake', emotion: 'angry', duration: 1200, bubbleColor: '#F44336' }
};

// ========== Composable ==========
export function useAIFallback(options = {}) {
    // 状态
    const currentLevel = ref(0);
    const errorCount = ref(0);
    const lastErrorTime = ref(0);
    const lastSuccessTime = ref(Date.now());
    const fallbackHistory = ref([]);

    // 计算属性
    const isUsingFallback = computed(() => currentLevel.value > 0);
    const currentTimeout = computed(() => FALLBACK_CONFIG.timeouts[currentLevel.value] || 5000);

    /**
     * 记录成功请求
     */
    const recordSuccess = () => {
        errorCount.value = 0;
        lastSuccessTime.value = Date.now();

        // 尝试恢复到更高级别
        if (currentLevel.value > 0) {
            const timeSinceLastError = Date.now() - lastErrorTime.value;
            if (timeSinceLastError > FALLBACK_CONFIG.recoveryTime) {
                upgradeLevel();
            }
        }
    };

    /**
     * 记录失败请求
     * @param {Error} error - 错误对象
     * @returns {number} 新的降级级别
     */
    const recordFailure = (error) => {
        errorCount.value++;
        lastErrorTime.value = Date.now();

        // 记录历史
        fallbackHistory.value.push({
            time: Date.now(),
            level: currentLevel.value,
            error: error.message || 'Unknown error'
        });

        // 限制历史长度
        if (fallbackHistory.value.length > 20) {
            fallbackHistory.value = fallbackHistory.value.slice(-20);
        }

        // 网络错误直接降到 Level 2
        if (isNetworkError(error)) {
            currentLevel.value = 2;
            debugLog('[Fallback] 网络错误，降级到 Level 2');
            return currentLevel.value;
        }

        // 超时错误降一级
        if (isTimeoutError(error)) {
            downgradeLevel();
            debugLog('[Fallback] 超时错误，降级到 Level', currentLevel.value);
            return currentLevel.value;
        }

        // 连续错误过多
        if (errorCount.value >= FALLBACK_CONFIG.errorThreshold) {
            downgradeLevel();
            debugLog('[Fallback] 连续错误过多，降级到 Level', currentLevel.value);
        }

        return currentLevel.value;
    };

    /**
     * 降级
     */
    const downgradeLevel = () => {
        currentLevel.value = Math.min(currentLevel.value + 1, 3);
    };

    /**
     * 升级（恢复）
     */
    const upgradeLevel = () => {
        currentLevel.value = Math.max(currentLevel.value - 1, 0);
        debugLog('[Fallback] 恢复到 Level', currentLevel.value);
    };

    /**
     * 强制设置级别
     */
    const setLevel = (level) => {
        currentLevel.value = Math.max(0, Math.min(level, 3));
    };

    /**
     * 重置到最高级别
     */
    const reset = () => {
        currentLevel.value = 0;
        errorCount.value = 0;
    };

    /**
     * 检查是否为网络错误
     */
    const isNetworkError = (error) => {
        const msg = error.message || '';
        return /network|offline|fetch|net::/i.test(msg) ||
            error.code === 'NETWORK_ERROR' ||
            !navigator.onLine;
    };

    /**
     * 检查是否为超时错误
     */
    const isTimeoutError = (error) => {
        const msg = error.message || '';
        return /timeout|超时|timed out/i.test(msg);
    };

    /**
     * 获取本地模板响应
     * @param {string} eventType - 事件类型
     * @param {number} mood - 心情值
     * @returns {Object} 响应对象
     */
    const getTemplateResponse = (eventType, mood = 50) => {
        const templates = LOCAL_TEMPLATES[eventType] || LOCAL_TEMPLATES.default;
        const moodLevel = mood > 60 ? 'high' : mood > 30 ? 'mid' : 'low';
        const options = templates[moodLevel] || templates.mid;

        const text = options[Math.floor(Math.random() * options.length)];

        return {
            text,
            emotion: moodLevel === 'high' ? 'happy' : moodLevel === 'low' ? 'sad' : 'neutral',
            action: moodLevel === 'high' ? 'jump' : 'idle',
            duration: 1000,
            bubbleColor: moodLevel === 'high' ? '#4CAF50' : moodLevel === 'low' ? '#F44336' : '#667eea'
        };
    };

    /**
     * 获取静态预设响应
     * @param {number} mood - 心情值
     * @returns {Object} 响应对象
     */
    const getStaticResponse = (mood = 50) => {
        if (mood > 70) return STATIC_RESPONSES.happy;
        if (mood > 40) return STATIC_RESPONSES.neutral;
        if (mood > 20) return STATIC_RESPONSES.sad;
        return STATIC_RESPONSES.angry;
    };

    /**
     * 获取降级统计
     */
    const getStats = () => ({
        currentLevel: currentLevel.value,
        errorCount: errorCount.value,
        timeSinceLastError: Date.now() - lastErrorTime.value,
        timeSinceLastSuccess: Date.now() - lastSuccessTime.value,
        recentFallbacks: fallbackHistory.value.slice(-5)
    });

    return {
        // 状态
        currentLevel,
        errorCount,
        // 计算属性
        isUsingFallback,
        currentTimeout,
        // 方法
        recordSuccess,
        recordFailure,
        upgradeLevel,
        downgradeLevel,
        setLevel,
        reset,
        getTemplateResponse,
        getStaticResponse,
        getStats,
        // 配置
        FALLBACK_CONFIG
    };
}
