/**
 * 手势识别 Composable
 * 职责: 解析悬浮窗传来的手势事件，识别手势类型和意图
 * 
 * 支持的手势:
 * - TAP: 单击
 * - DOUBLE_TAP: 双击
 * - LONG_PRESS: 长按
 * - SWIPE: 滑动 (UP/DOWN/LEFT/RIGHT)
 * - THROW: 快速拖拽 (向上抛出)
 * - DRAG: 慢速拖拽
 */
import { ref } from 'vue';
import { debugLog } from '@/utils/debugLog.js';

// ========== 手势类型常量 ==========
export const GESTURE_TYPES = {
    TAP: 'TAP',
    DOUBLE_TAP: 'DOUBLE_TAP',
    LONG_PRESS: 'LONG_PRESS',
    SWIPE: 'SWIPE',
    THROW: 'THROW',
    DRAG: 'DRAG',
    UNKNOWN: 'UNKNOWN'
};

// 手势对应的宠物动作
export const GESTURE_ACTIONS = {
    [GESTURE_TYPES.TAP]: { action: 'interact', emotion: 'happy', duration: 1500 },
    [GESTURE_TYPES.DOUBLE_TAP]: { action: 'celebrate', emotion: 'excited', duration: 2000 },
    [GESTURE_TYPES.LONG_PRESS]: { action: 'shy', emotion: 'shy', duration: 1000 },
    [GESTURE_TYPES.SWIPE]: { action: 'dodge', emotion: 'surprised', duration: 800 },
    [GESTURE_TYPES.THROW]: { action: 'scared', emotion: 'scared', duration: 1500 },
    [GESTURE_TYPES.DRAG]: { action: 'follow', emotion: 'curious', duration: 500 }
};

// ========== Composable ==========
export function useGestureRecognizer(options = {}) {
    const { debounceDelay = 300, onGestureRecognized } = options;

    // 状态
    const lastGestureTime = ref(0);
    const gestureHistory = ref([]);
    const currentGesture = ref(null);

    // 手势历史最大长度
    const MAX_HISTORY = 10;

    /**
     * 解析来自悬浮窗的手势事件
     * @param {Object} event - { type, duration, distance, direction, timestamp }
     * @returns {Object} - { gestureType, action, confidence, data }
     */
    const parseGestureEvent = (event) => {
        const now = Date.now();

        // 防抖检查
        if (now - lastGestureTime.value < debounceDelay) {
            return { gestureType: GESTURE_TYPES.UNKNOWN, confidence: 0 };
        }
        lastGestureTime.value = now;

        const { type, duration = 0, distance = 0, direction = '' } = event;
        let gestureType = GESTURE_TYPES.UNKNOWN;
        let confidence = 1.0;
        let additionalData = {};

        // 根据事件类型识别手势
        switch (type) {
            case 'pet_clicked':
            case 'TAP':
                gestureType = GESTURE_TYPES.TAP;
                break;

            case 'double_click':
            case 'DOUBLE_TAP':
                gestureType = GESTURE_TYPES.DOUBLE_TAP;
                break;

            case 'long_press':
            case 'LONGPRESS':
                gestureType = GESTURE_TYPES.LONG_PRESS;
                additionalData.duration = duration;
                break;

            case 'SWIPE':
                if (direction === 'UP' && distance > 100) {
                    gestureType = GESTURE_TYPES.THROW;
                    additionalData.intensity = Math.min(distance / 200, 1.0);
                } else {
                    gestureType = GESTURE_TYPES.SWIPE;
                    additionalData.direction = direction;
                }
                break;

            case 'drag_end':
            case 'DRAG':
                gestureType = GESTURE_TYPES.DRAG;
                break;

            default:
                gestureType = GESTURE_TYPES.UNKNOWN;
                confidence = 0.5;
        }

        const result = {
            gestureType,
            action: GESTURE_ACTIONS[gestureType] || GESTURE_ACTIONS[GESTURE_TYPES.TAP],
            confidence,
            timestamp: now,
            rawEvent: event,
            ...additionalData
        };

        // 记录手势历史
        addToHistory(result);
        currentGesture.value = result;

        debugLog('[Gesture] 识别:', gestureType, confidence);

        // 触发回调
        if (onGestureRecognized) {
            onGestureRecognized(result);
        }

        return result;
    };

    /**
     * 添加到手势历史
     */
    const addToHistory = (gesture) => {
        gestureHistory.value.push(gesture);
        if (gestureHistory.value.length > MAX_HISTORY) {
            gestureHistory.value.shift();
        }
    };

    /**
     * 检测连续手势模式
     * @param {string} pattern - 模式名称 (如 'TRIPLE_TAP')
     * @returns {boolean}
     */
    const detectPattern = (pattern) => {
        const recent = gestureHistory.value.slice(-5);
        const now = Date.now();

        switch (pattern) {
            case 'TRIPLE_TAP':
                // 1秒内3次点击
                const tapsInSecond = recent.filter(g =>
                    g.gestureType === GESTURE_TYPES.TAP &&
                    now - g.timestamp < 1000
                );
                return tapsInSecond.length >= 3;

            case 'SHAKE_GESTURE':
                // 检测左右晃动
                const swipes = recent.filter(g => g.gestureType === GESTURE_TYPES.SWIPE);
                if (swipes.length < 2) return false;
                const directions = swipes.map(s => s.direction);
                return directions.includes('LEFT') && directions.includes('RIGHT');

            default:
                return false;
        }
    };

    /**
     * 获取手势对应的反馈文本
     * @param {string} gestureType 
     * @param {number} mood - 当前心情值
     * @returns {string}
     */
    const getGestureResponse = (gestureType, mood = 50) => {
        const responses = {
            [GESTURE_TYPES.TAP]: {
                high: ['嘿嘿~', '怎么啦？', '在呢！', '想我了？'],
                mid: ['干嘛？', '嗯？', '...'],
                low: ['别戳了...', '心情不好...', '哼！']
            },
            [GESTURE_TYPES.DOUBLE_TAP]: {
                high: ['双击打开主界面~', '来玩吗？', '💕'],
                mid: ['要做什么？', '打开菜单？'],
                low: ['...有事？']
            },
            [GESTURE_TYPES.LONG_PRESS]: {
                high: ['别按太久啦~', '痒痒的！', '哈哈~'],
                mid: ['够了够了', '松开啦'],
                low: ['...松手', '不舒服']
            },
            [GESTURE_TYPES.THROW]: {
                high: ['呜哇！别甩我！', '好晕～', '我会飞！'],
                mid: ['喂！', '小心点！'],
                low: ['...你是不是讨厌我', '😢']
            }
        };

        const moodLevel = mood > 60 ? 'high' : mood > 30 ? 'mid' : 'low';
        const options = responses[gestureType]?.[moodLevel] || ['...'];
        return options[Math.floor(Math.random() * options.length)];
    };

    /**
     * 清空手势历史
     */
    const clearHistory = () => {
        gestureHistory.value = [];
        currentGesture.value = null;
    };

    return {
        // 状态
        currentGesture,
        gestureHistory,
        // 方法
        parseGestureEvent,
        detectPattern,
        getGestureResponse,
        clearHistory,
        // 常量
        GESTURE_TYPES,
        GESTURE_ACTIONS
    };
}
