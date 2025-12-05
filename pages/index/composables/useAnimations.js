/**
 * 动画系统 Composable
 * 职责: 管理宠物动画状态、优先级队列、悬浮窗/App内动画同步
 * 
 * 动画状态优先级（数字越大优先级越高）:
 * - idle: 0 (待机，可被任意状态打断)
 * - happy: 1 (开心，学习时触发)
 * - study: 2 (学习中，持续状态)
 * - angry: 3 (愤怒，摸鱼时触发)
 * - interact: 4 (互动，用户点击触发)
 */
import { ref, computed, watch, onUnmounted } from 'vue';
import { debugLog, logError } from '@/utils/debugLog.js';

// ========== 动画配置常量 ==========
export const ANIMATION_STATES = {
    IDLE: 'idle',
    HAPPY: 'happy',
    STUDY: 'study',
    ANGRY: 'angry',
    INTERACT: 'interact'
};

export const ANIMATION_CONFIG = {
    idle: {
        name: '待机',
        priority: 0,
        loop: true,
        duration: 0, // 无限循环
        cssClass: 'anim-idle',
        emoji: null // 使用皮肤默认emoji
    },
    happy: {
        name: '开心',
        priority: 1,
        loop: false,
        duration: 3000,
        cssClass: 'anim-happy',
        emoji: '😊'
    },
    study: {
        name: '学习中',
        priority: 2,
        loop: true,
        duration: 0, // 持续到状态改变
        cssClass: 'anim-study',
        emoji: '📚'
    },
    angry: {
        name: '愤怒',
        priority: 3,
        loop: false,
        duration: 2500,
        cssClass: 'anim-angry',
        shake: true,
        emoji: '😡'
    },
    interact: {
        name: '互动',
        priority: 4,
        loop: false,
        duration: 1500,
        cssClass: 'anim-interact',
        haptic: 'light',
        emoji: '💕'
    }
};

/**
 * 动画管理系统
 * @param {Object} options - 配置选项
 * @param {Object} options.floatWindowInstance - useFloatWindow 实例
 */
export function useAnimations(options = {}) {
    const { floatWindowInstance = null } = options;

    // ========== 响应式状态 ==========
    const currentState = ref(ANIMATION_STATES.IDLE);
    const previousState = ref(null);
    const animationQueue = ref([]); // 动画队列
    const isAnimating = ref(false);
    const stateHistory = ref([]); // 最近的状态历史（用于调试）

    // 定时器引用
    let stateTimer = null;

    // ========== 计算属性 ==========

    /**
     * 当前动画配置
     */
    const currentConfig = computed(() => {
        return ANIMATION_CONFIG[currentState.value] || ANIMATION_CONFIG.idle;
    });

    /**
     * 当前CSS类名
     */
    const animationClass = computed(() => {
        return currentConfig.value.cssClass;
    });

    /**
     * 当前状态的emoji覆盖（如果有）
     */
    const stateEmoji = computed(() => {
        return currentConfig.value.emoji;
    });

    /**
     * 是否正在抖动
     */
    const isShaking = computed(() => {
        return currentConfig.value.shake === true;
    });

    // ========== 核心方法 ==========

    /**
     * 改变动画状态
     * @param {string} newState - 新状态 (idle/happy/angry/study/interact)
     * @param {Object} options - 选项
     * @param {number} options.duration - 自定义持续时间（毫秒）
     * @param {boolean} options.force - 是否强制切换（忽略优先级）
     * @returns {boolean} 是否成功切换
     */
    function changeState(newState, options = {}) {
        const { duration = null, force = false } = options;

        // 验证状态有效性
        if (!ANIMATION_CONFIG[newState]) {
            logError('useAnimations', `无效的动画状态: ${newState}`);
            return false;
        }

        const newConfig = ANIMATION_CONFIG[newState];
        const currentConfig = ANIMATION_CONFIG[currentState.value];

        // 优先级判定（除非强制）
        if (!force && newConfig.priority < currentConfig.priority && currentState.value !== ANIMATION_STATES.IDLE) {
            debugLog('[动画系统]', `优先级不足，跳过切换: ${newState} (${newConfig.priority}) < ${currentState.value} (${currentConfig.priority})`);
            return false;
        }

        // 清除之前的定时器
        if (stateTimer) {
            clearTimeout(stateTimer);
            stateTimer = null;
        }

        // 记录状态历史
        previousState.value = currentState.value;
        stateHistory.value.push({
            from: currentState.value,
            to: newState,
            timestamp: Date.now()
        });
        if (stateHistory.value.length > 10) {
            stateHistory.value.shift();
        }

        // 切换状态
        currentState.value = newState;
        isAnimating.value = true;

        // 同步到悬浮窗
        syncStateToFloat(newState);

        debugLog('[动画系统]', `状态切换: ${previousState.value} → ${newState}`);

        // 设置自动恢复定时器（非循环动画）
        const stateDuration = duration || newConfig.duration;
        if (!newConfig.loop && stateDuration > 0) {
            stateTimer = setTimeout(() => {
                // 恢复到idle状态
                currentState.value = ANIMATION_STATES.IDLE;
                isAnimating.value = false;
                syncStateToFloat(ANIMATION_STATES.IDLE);
                debugLog('[动画系统]', `动画结束，恢复到 idle`);
            }, stateDuration);
        }

        // 触发触觉反馈
        if (newConfig.haptic) {
            triggerHaptic(newConfig.haptic);
        }

        return true;
    }

    /**
     * 立即恢复到待机状态
     */
    function resetToIdle() {
        if (stateTimer) {
            clearTimeout(stateTimer);
            stateTimer = null;
        }
        currentState.value = ANIMATION_STATES.IDLE;
        isAnimating.value = false;
        syncStateToFloat(ANIMATION_STATES.IDLE);
    }

    /**
     * 同步状态到悬浮窗
     * @param {string} state - 动画状态
     */
    function syncStateToFloat(state) {
        if (!floatWindowInstance || !floatWindowInstance.sendMessageToFloat) {
            return;
        }

        const config = ANIMATION_CONFIG[state];
        const message = {
            action: 'change_state',
            state: state,
            duration: config.duration,
            shake: config.shake || false,
            emoji: config.emoji
        };

        // 使用 type=98 作为动画状态的消息类型
        floatWindowInstance.sendMessageToFloat(98, JSON.stringify(message));
    }

    /**
     * 触发触觉反馈
     * @param {string} type - 反馈类型 (light/medium/heavy)
     */
    function triggerHaptic(type) {
        // #ifdef APP-PLUS
        switch (type) {
            case 'light':
                uni.vibrateShort({ type: 'light' });
                break;
            case 'medium':
                uni.vibrateShort({ type: 'medium' });
                break;
            case 'heavy':
                uni.vibrateLong();
                break;
        }
        // #endif
    }

    // ========== 便捷方法 ==========

    /**
     * 播放开心动画
     * @param {number} duration - 持续时间
     */
    function playHappy(duration = 3000) {
        return changeState(ANIMATION_STATES.HAPPY, { duration });
    }

    /**
     * 播放愤怒动画
     * @param {number} duration - 持续时间
     */
    function playAngry(duration = 2500) {
        return changeState(ANIMATION_STATES.ANGRY, { duration });
    }

    /**
     * 播放互动动画
     * @param {number} duration - 持续时间
     */
    function playInteract(duration = 1500) {
        return changeState(ANIMATION_STATES.INTERACT, { duration, force: true });
    }

    /**
     * 进入学习状态
     */
    function enterStudyMode() {
        return changeState(ANIMATION_STATES.STUDY);
    }

    /**
     * 退出学习状态（恢复idle）
     */
    function exitStudyMode() {
        if (currentState.value === ANIMATION_STATES.STUDY) {
            resetToIdle();
        }
    }

    // ========== 生命周期 ==========

    onUnmounted(() => {
        if (stateTimer) {
            clearTimeout(stateTimer);
        }
    });

    // ========== 返回公开API ==========
    return {
        // 状态
        currentState,
        previousState,
        currentConfig,
        animationClass,
        stateEmoji,
        isAnimating,
        isShaking,
        stateHistory,

        // 核心方法
        changeState,
        resetToIdle,
        syncStateToFloat,

        // 便捷方法
        playHappy,
        playAngry,
        playInteract,
        enterStudyMode,
        exitStudyMode,

        // 常量导出
        ANIMATION_STATES,
        ANIMATION_CONFIG
    };
}
