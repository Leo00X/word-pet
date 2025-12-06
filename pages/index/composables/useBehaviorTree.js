/**
 * 行为树状态管理 Composable
 * 职责: 管理宠物根状态、状态流转规则、触发条件检测
 * 
 * 根状态 (Root States):
 * - IDLE: 待机状态 (根据心情细分: normal/sleepy/anxious)
 * - INTERACTION: 互动中 (被触摸/对话/玩耍)
 * - WORKING: 工作中 (监控学习/庆祝成就)
 * - ANGRY: 愤怒 (警告摸鱼)
 * - SLEEPING: 睡眠 (休息恢复)
 */
import { ref, computed, watch } from 'vue';
import { debugLog } from '@/utils/debugLog.js';

// ========== 状态定义 ==========
export const ROOT_STATES = {
    IDLE: 'IDLE',
    INTERACTION: 'INTERACTION',
    WORKING: 'WORKING',
    ANGRY: 'ANGRY',
    SLEEPING: 'SLEEPING'
};

export const SUB_STATES = {
    // IDLE 子状态
    IDLE_NORMAL: 'idle_normal',
    IDLE_SLEEPY: 'idle_sleepy',
    IDLE_ANXIOUS: 'idle_anxious',
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
    WARNING_L3: 'warning_l3'
};

// 状态转换规则
const STATE_TRANSITIONS = {
    [ROOT_STATES.IDLE]: [ROOT_STATES.INTERACTION, ROOT_STATES.WORKING, ROOT_STATES.ANGRY, ROOT_STATES.SLEEPING],
    [ROOT_STATES.INTERACTION]: [ROOT_STATES.IDLE, ROOT_STATES.ANGRY],
    [ROOT_STATES.WORKING]: [ROOT_STATES.IDLE, ROOT_STATES.ANGRY, ROOT_STATES.INTERACTION],
    [ROOT_STATES.ANGRY]: [ROOT_STATES.IDLE, ROOT_STATES.INTERACTION],
    [ROOT_STATES.SLEEPING]: [ROOT_STATES.IDLE]
};

// ========== 行为树节点类 ==========
class BTNode {
    constructor(name) {
        this.name = name;
    }
    tick(ctx) { throw new Error('tick() must be implemented'); }
}

class ConditionNode extends BTNode {
    constructor(name, condition) {
        super(name);
        this.condition = condition;
    }
    tick(ctx) {
        return this.condition(ctx) ? 'success' : 'failure';
    }
}

class ActionNode extends BTNode {
    constructor(name, action) {
        super(name);
        this.action = action;
    }
    tick(ctx) {
        this.action(ctx);
        return 'success';
    }
}

class SelectorNode extends BTNode {
    constructor(name, children = []) {
        super(name);
        this.children = children;
    }
    tick(ctx) {
        for (const child of this.children) {
            if (child.tick(ctx) === 'success') return 'success';
        }
        return 'failure';
    }
}

class SequenceNode extends BTNode {
    constructor(name, children = []) {
        super(name);
        this.children = children;
    }
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

    // 状态
    const rootState = ref(ROOT_STATES.IDLE);
    const subState = ref(SUB_STATES.IDLE_NORMAL);
    const lastInteractionTime = ref(Date.now());
    const warningLevel = ref(0);

    // 计算属性
    const isIdle = computed(() => rootState.value === ROOT_STATES.IDLE);
    const isAngry = computed(() => rootState.value === ROOT_STATES.ANGRY);
    const isInteracting = computed(() => rootState.value === ROOT_STATES.INTERACTION);

    // 构建行为树
    const buildTree = () => {
        return new SelectorNode('Root', [
            // 1. 检查愤怒条件
            new SequenceNode('AngryCheck', [
                new ConditionNode('IsMoodCritical', (ctx) => ctx.mood < 20),
                new ActionNode('EnterAngry', (ctx) => {
                    transitionTo(ROOT_STATES.ANGRY, SUB_STATES.WARNING_L1);
                })
            ]),
            // 2. 检查互动状态
            new SequenceNode('InteractionCheck', [
                new ConditionNode('HasRecentInteraction', (ctx) => {
                    return Date.now() - lastInteractionTime.value < 5000;
                }),
                new ActionNode('StayInteraction', (ctx) => {
                    if (rootState.value !== ROOT_STATES.INTERACTION) {
                        transitionTo(ROOT_STATES.INTERACTION, SUB_STATES.BEING_TOUCHED);
                    }
                })
            ]),
            // 3. 检查工作状态
            new SequenceNode('WorkingCheck', [
                new ConditionNode('IsMonitoring', (ctx) => ctx.isMonitoring),
                new ActionNode('EnterWorking', (ctx) => {
                    transitionTo(ROOT_STATES.WORKING, SUB_STATES.MONITORING);
                })
            ]),
            // 4. 默认待机
            new ActionNode('EnterIdle', (ctx) => {
                if (rootState.value !== ROOT_STATES.IDLE) {
                    const idleType = ctx.mood > 60 ? SUB_STATES.IDLE_NORMAL :
                        ctx.mood < 40 ? SUB_STATES.IDLE_ANXIOUS :
                            SUB_STATES.IDLE_NORMAL;
                    transitionTo(ROOT_STATES.IDLE, idleType);
                }
            })
        ]);
    };

    const tree = buildTree();

    // 状态转换
    const transitionTo = (newRoot, newSub = null) => {
        const allowed = STATE_TRANSITIONS[rootState.value];
        if (!allowed?.includes(newRoot) && rootState.value !== newRoot) {
            debugLog('[BT] 无效转换:', rootState.value, '->', newRoot);
            return false;
        }

        const oldRoot = rootState.value;
        const oldSub = subState.value;

        rootState.value = newRoot;
        if (newSub) subState.value = newSub;

        debugLog('[BT] 状态转换:', oldRoot, '->', newRoot, newSub);

        if (onStateChange) {
            onStateChange({ root: newRoot, sub: newSub, oldRoot, oldSub });
        }
        return true;
    };

    // 每帧更新
    const tick = (context = {}) => {
        const ctx = {
            mood: context.mood ?? 50,
            isMonitoring: context.isMonitoring ?? false,
            ...context
        };
        tree.tick(ctx);
    };

    // 触发互动
    const triggerInteraction = (type = 'touch') => {
        lastInteractionTime.value = Date.now();
        transitionTo(ROOT_STATES.INTERACTION, SUB_STATES.BEING_TOUCHED);
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

    return {
        // 状态
        rootState,
        subState,
        warningLevel,
        // 计算属性
        isIdle,
        isAngry,
        isInteracting,
        // 方法
        tick,
        transitionTo,
        triggerInteraction,
        escalateWarning,
        resetWarning,
        // 常量
        ROOT_STATES,
        SUB_STATES
    };
}
