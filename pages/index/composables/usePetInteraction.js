/**
 * 宠物互动协调器 Composable (Phase 3 增强版)
 * 职责: 整合行为树、手势识别、AI控制、互动链，提供统一的互动接口
 * 
 * 这是所有互动模块的"大脑"，协调各模块之间的通信
 * 
 * Phase 3: AI 增强集成
 * - 记忆系统传递给 AI 控制器
 * - 行为树状态感知
 * - 对话历史上下文
 */
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useBehaviorTree, ROOT_STATES } from './useBehaviorTree.js';
import { useGestureRecognizer, GESTURE_TYPES } from './useGestureRecognizer.js';
import { useAIController } from './useAIController.js';
import { useInteractionChain, CHAIN_TYPES } from './useInteractionChain.js';
import { useGrowth } from './useGrowth.js';
import { useAnimations } from './useAnimations.js';
import { useMemory } from './useMemory.js';
import { debugLog } from '@/utils/debugLog.js';

// ========== Composable ==========
export function usePetInteraction(options = {}) {
    const { floatWindowInstance, onSendToFloat, addLog } = options;

    // 引入子模块
    const growth = useGrowth();
    const animations = useAnimations({ floatWindowInstance });
    const memorySystem = useMemory();  // [Phase 3] 记忆系统

    const behaviorTree = useBehaviorTree({
        onStateChange: handleStateChange
    });

    const gestureRecognizer = useGestureRecognizer({
        onGestureRecognized: handleGestureRecognized
    });

    // [Phase 3] AI 控制器集成记忆和行为树
    const aiController = useAIController({
        memorySystem: memorySystem,
        behaviorTree: behaviorTree
    });

    const interactionChain = useInteractionChain({
        onChainStep: handleChainStep,
        onChainComplete: handleChainComplete
    });

    // 状态
    const isProcessing = ref(false);
    const lastInteraction = ref(null);

    // 定时器
    let tickInterval = null;

    // ========== 事件处理 ==========

    /**
     * 处理行为树状态变化 (Phase 2 增强)
     */
    function handleStateChange({ root, sub, oldRoot }) {
        debugLog('[Interaction] 状态变化:', oldRoot, '->', root, sub);

        // 根据新状态触发动画
        switch (root) {
            case ROOT_STATES.ANGRY:
                animations.playAngry();
                break;
            case ROOT_STATES.INTERACTION:
                animations.playInteract();
                break;
            case ROOT_STATES.WORKING:
                animations.enterStudyMode();
                break;
            case ROOT_STATES.SLEEPING:
                // 发送睡眠状态到悬浮窗
                sendResponseToFloat('💤 zzz...', { action: 'sleep', duration: 0 });
                if (addLog) addLog('宠物进入睡眠状态');
                break;
            default:
                animations.resetToIdle();
        }

        // 处理从睡眠状态唤醒
        if (oldRoot === ROOT_STATES.SLEEPING && root !== ROOT_STATES.SLEEPING) {
            const wakeData = behaviorTree.sleepWake.wakeUp('state_change');
            if (wakeData && wakeData.moodRecovered > 0) {
                growth.changeMood(wakeData.moodRecovered);
                sendResponseToFloat(`😊 睡醒了！心情+${wakeData.moodRecovered}`, { action: 'jump', duration: 1500 });
                if (addLog) addLog(`唤醒: 睡眠${wakeData.sleepMinutes}分钟, 心情+${wakeData.moodRecovered}`);
            }
        }
    }

    /**
     * 处理手势识别结果
     */
    async function handleGestureRecognized(gesture) {
        if (isProcessing.value) return;
        isProcessing.value = true;

        try {
            const { gestureType, action } = gesture;
            lastInteraction.value = { type: gestureType, time: Date.now() };

            // 触发行为树互动
            behaviorTree.triggerInteraction(gestureType);

            // 增加心情和亲密度
            const interactResult = growth.interact();
            if (addLog) {
                addLog(`互动: ${gestureType} 心情+${interactResult.mood}`);
            }

            // 根据手势类型决定是否调用 AI
            if (gestureType === GESTURE_TYPES.TAP || gestureType === GESTURE_TYPES.LONG_PRESS) {
                // 简单手势：使用本地快速响应
                const response = gestureRecognizer.getGestureResponse(
                    gestureType,
                    growth.mood.value
                );
                sendResponseToFloat(response, action);
            } else if (gestureType === GESTURE_TYPES.DOUBLE_TAP) {
                // 双击：启动主界面（不调用 AI）
                sendResponseToFloat('💬 打开主界面~', { action: 'celebrate', duration: 1000 });
            } else {
                // 复杂手势：调用 AI
                await requestAIResponse(gestureType);
            }

        } finally {
            isProcessing.value = false;
        }
    }

    /**
     * 请求 AI 响应并发送到悬浮窗
     */
    async function requestAIResponse(gestureType) {
        const context = {
            action: gestureType,
            gestureType,
            mood: growth.mood.value,
            level: growth.petLevel.value,
            studyMinutes: uni.getStorageSync('today_study_minutes') || 0
        };

        const response = await aiController.requestResponse(context);
        sendResponseToFloat(response.text, response);
    }

    /**
     * 发送响应到悬浮窗
     */
    function sendResponseToFloat(text, actionConfig = {}) {
        const { action = 'idle', duration = 1000, bubbleColor = '#667eea' } = actionConfig;

        if (onSendToFloat) {
            onSendToFloat(200, JSON.stringify({
                action,
                text: typeof text === 'string' ? text : text.text || '...',
                bubbleColor,
                duration
            }));
        }
    }

    /**
     * 处理互动链步骤
     */
    async function handleChainStep({ chain, step, data }) {
        debugLog('[Interaction] 链步骤:', chain, step.id);

        switch (step.action) {
            case 'play_animation':
                animations.changeState(step.params.anim, { duration: step.params.duration });
                break;

            case 'show_bubble':
                let text = step.params.text;
                // 替换变量
                Object.keys(data).forEach(key => {
                    text = text.replace(`{${key}}`, data[key]);
                });
                sendResponseToFloat(text, { duration: 3000 });
                break;

            case 'ai_response':
                await requestAIResponse(step.params.prompt);
                interactionChain.advanceStep();
                break;

            case 'gesture_response':
                const response = aiController.getLocalResponse(
                    data.gestureType || 'TAP',
                    growth.mood.value
                );
                sendResponseToFloat(response.text, response);
                break;
        }
    }

    /**
     * 处理互动链完成
     */
    function handleChainComplete({ chain, data }) {
        debugLog('[Interaction] 链完成:', chain);
        behaviorTree.transitionTo(ROOT_STATES.IDLE);
    }

    // ========== 公共方法 ==========

    /**
     * 处理悬浮窗消息
     */
    const handleFloatMessage = (type, data) => {
        // 解析手势事件
        if (type === 1 || type === 3 || type === 4 || type === 100) {
            try {
                const event = typeof data === 'string' ? JSON.parse(data) : data;
                gestureRecognizer.parseGestureEvent(event);
            } catch (e) {
                debugLog('[Interaction] 消息解析失败:', e);
            }
        }
    };

    /**
     * 启动问候链
     */
    const triggerGreeting = () => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? '早安' : hour < 18 ? '下午好' : '晚上好';
        interactionChain.startChain(CHAIN_TYPES.GREETING, { greeting, hour });
    };

    /**
     * 启动学习奖励链
     */
    const triggerStudyReward = (xp, minutes) => {
        interactionChain.startChain(CHAIN_TYPES.STUDY_REWARD, { xp, minutes });
    };

    /**
     * 启动摸鱼警告链
     */
    const triggerFishWarning = (appName, minutes) => {
        interactionChain.startChain(CHAIN_TYPES.FISH_WARNING, { app: appName, min: minutes });
    };

    /**
     * 启动行为树 tick 定时器
     */
    const startTick = () => {
        if (tickInterval) return;
        tickInterval = setInterval(() => {
            behaviorTree.tick({
                mood: growth.mood.value,
                isMonitoring: uni.getStorageSync('IS_MONITORING') || false
            });
        }, 5000); // 每5秒 tick 一次
    };

    /**
     * 停止 tick 定时器
     */
    const stopTick = () => {
        if (tickInterval) {
            clearInterval(tickInterval);
            tickInterval = null;
        }
    };

    // 生命周期
    onMounted(() => {
        startTick();
    });

    onUnmounted(() => {
        stopTick();
    });

    return {
        // 子模块引用
        behaviorTree,
        gestureRecognizer,
        aiController,
        interactionChain,
        growth,
        animations,
        // 状态
        isProcessing,
        lastInteraction,
        // 方法
        handleFloatMessage,
        triggerGreeting,
        triggerStudyReward,
        triggerFishWarning,
        startTick,
        stopTick
    };
}
