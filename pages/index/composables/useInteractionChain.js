/**
 * 连续互动链 Composable
 * 职责: 管理树形连续互动场景，协调手势→动画→AI→二次反馈的完整流程
 * 
 * 互动链场景:
 * - GREETING: 启动问候链
 * - STUDY_REWARD: 学习奖励链
 * - FISH_WARNING: 摸鱼警告链
 * - TOUCH_CHAIN: 触摸互动链
 */
import { ref, computed } from 'vue';
import { debugLog } from '@/utils/debugLog.js';

// ========== 互动链定义 ==========
export const CHAIN_TYPES = {
    GREETING: 'GREETING',
    STUDY_REWARD: 'STUDY_REWARD',
    FISH_WARNING: 'FISH_WARNING',
    TOUCH_CHAIN: 'TOUCH_CHAIN'
};

// 链状态
export const CHAIN_STATUS = {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    WAITING_INPUT: 'WAITING_INPUT',
    COMPLETED: 'COMPLETED'
};

// ========== Composable ==========
export function useInteractionChain(options = {}) {
    const { onChainStep, onChainComplete } = options;

    // 状态
    const currentChain = ref(null);
    const chainStatus = ref(CHAIN_STATUS.IDLE);
    const currentStep = ref(0);
    const chainData = ref({});

    // 链定义
    const chains = {
        [CHAIN_TYPES.GREETING]: {
            name: '问候链',
            steps: [
                { id: 'wake', action: 'play_animation', params: { anim: 'idle', duration: 500 } },
                { id: 'greet', action: 'ai_response', params: { prompt: 'greeting' } },
                { id: 'wait', action: 'wait_interaction', params: { timeout: 10000 } },
                { id: 'react', action: 'ai_response', params: { prompt: 'react_to_touch' } }
            ]
        },
        [CHAIN_TYPES.STUDY_REWARD]: {
            name: '学习奖励链',
            steps: [
                { id: 'celebrate', action: 'play_animation', params: { anim: 'celebrate', duration: 1500 } },
                { id: 'praise', action: 'show_bubble', params: { text: '好样的！经验+{xp}' } },
                { id: 'wait', action: 'wait_interaction', params: { timeout: 5000 } },
                { id: 'suggest', action: 'ai_response', params: { prompt: 'suggest_break' } }
            ]
        },
        [CHAIN_TYPES.FISH_WARNING]: {
            name: '摸鱼警告链',
            steps: [
                { id: 'sad', action: 'play_animation', params: { anim: 'sad', duration: 1000 } },
                { id: 'warn_l1', action: 'show_bubble', params: { text: '你已经刷{app}了{min}分钟...' } },
                { id: 'wait', action: 'wait_change', params: { timeout: 900000, checkApp: true } },
                { id: 'warn_l2', action: 'escalate', params: { action: 'shake', text: '真的不打算学习了吗？💢' } }
            ]
        },
        [CHAIN_TYPES.TOUCH_CHAIN]: {
            name: '触摸互动链',
            steps: [
                { id: 'react', action: 'play_animation', params: { anim: 'interact', duration: 800 } },
                { id: 'respond', action: 'gesture_response', params: {} },
                { id: 'ai', action: 'ai_response', params: { prompt: 'react_to_gesture' } }
            ]
        }
    };

    /**
     * 开始互动链
     * @param {string} chainType 
     * @param {Object} initialData 
     */
    const startChain = (chainType, initialData = {}) => {
        if (!chains[chainType]) {
            debugLog('[Chain] 未知链类型:', chainType);
            return false;
        }

        currentChain.value = chainType;
        chainStatus.value = CHAIN_STATUS.RUNNING;
        currentStep.value = 0;
        chainData.value = { ...initialData };

        debugLog('[Chain] 开始:', chainType);
        executeStep();
        return true;
    };

    /**
     * 执行当前步骤
     */
    const executeStep = async () => {
        const chain = chains[currentChain.value];
        if (!chain || currentStep.value >= chain.steps.length) {
            completeChain();
            return;
        }

        const step = chain.steps[currentStep.value];
        debugLog('[Chain] 执行步骤:', step.id, step.action);

        // 发送步骤事件
        if (onChainStep) {
            await onChainStep({
                chain: currentChain.value,
                step: step,
                stepIndex: currentStep.value,
                data: chainData.value
            });
        }

        // 处理等待类型的步骤
        if (step.action === 'wait_interaction' || step.action === 'wait_change') {
            chainStatus.value = CHAIN_STATUS.WAITING_INPUT;

            // 设置超时
            if (step.params.timeout) {
                setTimeout(() => {
                    if (chainStatus.value === CHAIN_STATUS.WAITING_INPUT) {
                        advanceStep();
                    }
                }, step.params.timeout);
            }
        } else {
            // 自动推进到下一步
            if (step.params?.duration) {
                setTimeout(() => advanceStep(), step.params.duration);
            } else {
                // 等待回调触发下一步
            }
        }
    };

    /**
     * 推进到下一步
     */
    const advanceStep = () => {
        currentStep.value++;
        chainStatus.value = CHAIN_STATUS.RUNNING;
        executeStep();
    };

    /**
     * 完成互动链
     */
    const completeChain = () => {
        debugLog('[Chain] 完成:', currentChain.value);

        if (onChainComplete) {
            onChainComplete({
                chain: currentChain.value,
                data: chainData.value
            });
        }

        chainStatus.value = CHAIN_STATUS.COMPLETED;
        currentChain.value = null;
        currentStep.value = 0;
        chainData.value = {};
    };

    /**
     * 中断互动链
     */
    const interruptChain = () => {
        if (chainStatus.value !== CHAIN_STATUS.IDLE) {
            debugLog('[Chain] 中断:', currentChain.value);
            chainStatus.value = CHAIN_STATUS.IDLE;
            currentChain.value = null;
        }
    };

    /**
     * 用户交互触发（用于等待状态）
     */
    const triggerUserInput = (inputType, inputData = {}) => {
        if (chainStatus.value !== CHAIN_STATUS.WAITING_INPUT) {
            return false;
        }

        chainData.value = { ...chainData.value, lastInput: { type: inputType, ...inputData } };
        advanceStep();
        return true;
    };

    /**
     * 更新链数据
     */
    const updateChainData = (data) => {
        chainData.value = { ...chainData.value, ...data };
    };

    // 计算属性
    const isRunning = computed(() => chainStatus.value === CHAIN_STATUS.RUNNING);
    const isWaiting = computed(() => chainStatus.value === CHAIN_STATUS.WAITING_INPUT);

    return {
        // 状态
        currentChain,
        chainStatus,
        currentStep,
        chainData,
        // 计算属性
        isRunning,
        isWaiting,
        // 方法
        startChain,
        advanceStep,
        interruptChain,
        triggerUserInput,
        updateChainData,
        // 常量
        CHAIN_TYPES,
        CHAIN_STATUS
    };
}
