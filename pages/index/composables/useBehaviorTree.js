/**
 * 行为树状态管理 Composable (Phase 2 增强版)
 * 职责: 管理宠物根状态、状态流转规则、触发条件检测
 * 
 * 根状态 (Root States):
 * - IDLE: 待机状态 (细分: normal/sleepy/anxious/bored/excited)
 * - INTERACTION: 互动中 (被触摸/对话/玩耍)
 * - WORKING: 工作中 (监控学习/庆祝成就)
 * - ANGRY: 愤怒 (警告摸鱼)
 * - SLEEPING: 睡眠 (休息恢复)
 * 
 * Phase 2 新增：
 * - 状态持续时间追踪
 * - 睡眠/唤醒逻辑
 * - 更多细分子状态
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { debugLog } from '@/utils/debugLog.js';
import { useStateDuration } from './useStateDuration.js';
import { useSleepWake } from './useSleepWake.js';

// ========== 状态定义 ==========
export const ROOT_STATES = {
    IDLE: 'IDLE',
    INTERACTION: 'INTERACTION',
    WORKING: 'WORKING',
    ANGRY: 'ANGRY',
    SLEEPING: 'SLEEPING'
};

export const SUB_STATES = {
    // IDLE 子状态 (Phase 2 增强)
    IDLE_NORMAL: 'idle_normal',
    IDLE_SLEEPY: 'idle_sleepy',
    IDLE_ANXIOUS: 'idle_anxious',
    IDLE_BORED: 'idle_bored',      // [新] 无聊（长时间无互动）
    IDLE_EXCITED: 'idle_excited',  // [新] 兴奋（刚完成任务）
    IDLE_HUNGRY: 'idle_hungry',    // [新] 饥饿（饥饿度低）
    // INTERACTION 子状态
    BEING_TOUCHED: 'being_touched',
    CHATTING: 'chatting',
    PLAYING: 'playing',
    // WORKING 子状态
    MONITORING: 'monitoring',
    CELEBRATING: 'celebrating',
    // ANGRY 子状态
    WARNING_L1: 'warning_l1',
    WARNING_L2: 'warning_l2',
    WARNING_L3: 'warning_l3',
    // SLEEPING 子状态 [新]
    LIGHT_SLEEP: 'light_sleep',
    DEEP_SLEEP: 'deep_sleep',
    DREAMING: 'dreaming'
};

// 状态转换规则
const STATE_TRANSITIONS = {
    [ROOT_STATES.IDLE]: [ROOT_STATES.INTERACTION, ROOT_STATES.WORKING, ROOT_STATES.ANGRY, ROOT_STATES.SLEEPING],
    [ROOT_STATES.INTERACTION]: [ROOT_STATES.IDLE, ROOT_STATES.ANGRY],
    [ROOT_STATES.WORKING]: [ROOT_STATES.IDLE, ROOT_STATES.ANGRY, ROOT_STATES.INTERACTION],
    [ROOT_STATES.ANGRY]: [ROOT_STATES.IDLE, ROOT_STATES.INTERACTION],
    [ROOT_STATES.SLEEPING]: [ROOT_STATES.IDLE, ROOT_STATES.INTERACTION]  // 可被互动唤醒
};

// ========== 行为树节点类 ==========
class BTNode {
    constructor(name) { this.name = name; }
    tick(ctx) { throw new Error('tick() must be implemented'); }
}

class ConditionNode extends BTNode {
    constructor(name, condition) { super(name); this.condition = condition; }
    tick(ctx) { return this.condition(ctx) ? 'success' : 'failure'; }
}

class ActionNode extends BTNode {
    constructor(name, action) { super(name); this.action = action; }
    tick(ctx) { this.action(ctx); return 'success'; }
}

class SelectorNode extends BTNode {
    constructor(name, children = []) { super(name); this.children = children; }
    tick(ctx) {
        for (const child of this.children) {
            if (child.tick(ctx) === 'success') return 'success';
        }
        return 'failure';
    }
}

class SequenceNode extends BTNode {
    constructor(name, children = []) { super(name); this.children = children; }
    tick(ctx) {
        for (const child of this.children) {
            if (child.tick(ctx) !== 'success') return 'failure';
        }
        return 'success';
    }
}

// ========== Composable ==========
export function useBehaviorTree(options = {}) {
    const { onStateChange } = options;

    // 集成子模块
    const stateDuration = useStateDuration();
    const sleepWake = useSleepWake({
        onSleep: (data) => transitionTo(ROOT_STATES.SLEEPING, SUB_STATES.LIGHT_SLEEP),
        onWake: (data) => handleWakeUp(data),
        onDream: (dream) => { subState.value = SUB_STATES.DREAMING; }
    });

    // 状态
    const rootState = ref(ROOT_STATES.IDLE);
    const subState = ref(SUB_STATES.IDLE_NORMAL);
    const lastInteractionTime = ref(Date.now());
    const warningLevel = ref(0);

    // 计算属性
    const isIdle = computed(() => rootState.value === ROOT_STATES.IDLE);
    const isAngry = computed(() => rootState.value === ROOT_STATES.ANGRY);
    const isInteracting = computed(() => rootState.value === ROOT_STATES.INTERACTION);
    const isSleeping = computed(() => rootState.value === ROOT_STATES.SLEEPING);

    // 构建增强版行为树
    const buildTree = () => {
        return new SelectorNode('Root', [
            // 1. 检查睡眠状态
            new SequenceNode('SleepCheck', [
                new ConditionNode('IsSleeping', () => sleepWake.isSleeping.value),
                new ActionNode('MaintainSleep', () => {
                    if (rootState.value !== ROOT_STATES.SLEEPING) {
                        transitionTo(ROOT_STATES.SLEEPING, SUB_STATES.DEEP_SLEEP);
                    }
                })
            ]),
            // 2. 检查是否应该入睡
            new SequenceNode('ShouldSleepCheck', [
                new ConditionNode('ShouldSleep', () => sleepWake.checkShouldSleep() !== null),
                new ActionNode('EnterSleep', () => {
                    const reason = sleepWake.checkShouldSleep();
                    sleepWake.startSleep(reason);
                })
            ]),
            // 3. 检查愤怒条件
            new SequenceNode('AngryCheck', [
                new ConditionNode('IsMoodCritical', (ctx) => ctx.mood < 20),
                new ActionNode('EnterAngry', () => {
                    transitionTo(ROOT_STATES.ANGRY, SUB_STATES.WARNING_L1);
                })
            ]),
            // 4. 检查互动状态
            new SequenceNode('InteractionCheck', [
                new ConditionNode('HasRecentInteraction', () => {
                    return Date.now() - lastInteractionTime.value < 5000;
                }),
                new ActionNode('StayInteraction', () => {
                    if (rootState.value !== ROOT_STATES.INTERACTION) {
                        transitionTo(ROOT_STATES.INTERACTION, SUB_STATES.BEING_TOUCHED);
                    }
                })
            ]),
            // 5. 检查工作状态
            new SequenceNode('WorkingCheck', [
                new ConditionNode('IsMonitoring', (ctx) => ctx.isMonitoring),
                new ActionNode('EnterWorking', () => {
                    transitionTo(ROOT_STATES.WORKING, SUB_STATES.MONITORING);
                })
            ]),
            // 6. 默认待机（根据条件细分）
            new ActionNode('EnterIdle', (ctx) => {
                if (rootState.value !== ROOT_STATES.IDLE) {
                    const idleType = determineIdleSubState(ctx);
                    transitionTo(ROOT_STATES.IDLE, idleType);
                }
            })
        ]);
    };

    /**
     * 确定待机子状态 (Phase 2 增强)
     */
    const determineIdleSubState = (ctx) => {
        const idleTime = Date.now() - lastInteractionTime.value;

        // 优先级判断
        if (ctx.hunger !== undefined && ctx.hunger < 30) {
            return SUB_STATES.IDLE_HUNGRY;
        }
        if (ctx.mood > 80) {
            return SUB_STATES.IDLE_EXCITED;
        }
        if (ctx.mood < 40) {
            return SUB_STATES.IDLE_ANXIOUS;
        }
        if (idleTime > 10 * 60 * 1000) {  // 10分钟无互动
            return SUB_STATES.IDLE_BORED;
        }
        if (sleepWake.isNightTime.value && ctx.mood < 60) {
            return SUB_STATES.IDLE_SLEEPY;
        }
        return SUB_STATES.IDLE_NORMAL;
    };

    const tree = buildTree();

    // 状态转换（集成持续时间追踪）
    const transitionTo = (newRoot, newSub = null) => {
        const allowed = STATE_TRANSITIONS[rootState.value];
        if (!allowed?.includes(newRoot) && rootState.value !== newRoot) {
            debugLog('[BT] 无效转换:', rootState.value, '->', newRoot);
            return false;
        }

        const oldRoot = rootState.value;
        const oldSub = subState.value;

        // 追踪状态持续时间
        stateDuration.startTracking(newRoot, newSub);

        rootState.value = newRoot;
        if (newSub) subState.value = newSub;

        debugLog('[BT] 状态转换:', oldRoot, '->', newRoot, newSub);

        if (onStateChange) {
            onStateChange({ root: newRoot, sub: newSub, oldRoot, oldSub });
        }
        return true;
    };

    /**
     * 处理唤醒
     */
    const handleWakeUp = (data) => {
        debugLog('[BT] 唤醒:', data.reason, '恢复心情:', data.moodRecovered);
        transitionTo(ROOT_STATES.IDLE, SUB_STATES.IDLE_NORMAL);
    };

    // 每帧更新
    const tick = (context = {}) => {
        const ctx = {
            mood: context.mood ?? 50,
            hunger: context.hunger ?? 100,
            isMonitoring: context.isMonitoring ?? false,
            ...context
        };
        tree.tick(ctx);
    };

    // 触发互动
    const triggerInteraction = (type = 'touch') => {
        lastInteractionTime.value = Date.now();
        sleepWake.recordInteraction();  // 记录互动（可能唤醒）

        if (!isSleeping.value) {
            transitionTo(ROOT_STATES.INTERACTION, SUB_STATES.BEING_TOUCHED);
        }
    };

    // 升级警告等级
    const escalateWarning = () => {
        warningLevel.value = Math.min(warningLevel.value + 1, 3);
        const subStateMap = {
            1: SUB_STATES.WARNING_L1,
            2: SUB_STATES.WARNING_L2,
            3: SUB_STATES.WARNING_L3
        };
        transitionTo(ROOT_STATES.ANGRY, subStateMap[warningLevel.value]);
    };

    // 重置警告
    const resetWarning = () => {
        warningLevel.value = 0;
        transitionTo(ROOT_STATES.IDLE, SUB_STATES.IDLE_NORMAL);
    };

    // 手动触发睡眠
    const triggerSleep = () => {
        sleepWake.startSleep('manual');
    };

    // 手动唤醒
    const triggerWakeUp = () => {
        return sleepWake.wakeUp('manual');
    };

    // 生命周期
    onMounted(() => {
        stateDuration.loadStats();
        sleepWake.loadSleepState();
    });

    return {
        // 状态
        rootState,
        subState,
        warningLevel,
        // 计算属性
        isIdle,
        isAngry,
        isInteracting,
        isSleeping,
        // 子模块
        stateDuration,
        sleepWake,
        // 方法
        tick,
        transitionTo,
        triggerInteraction,
        escalateWarning,
        resetWarning,
        triggerSleep,
        triggerWakeUp,
        // 常量
        ROOT_STATES,
        SUB_STATES
    };
}

