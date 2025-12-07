/**
 * 睡眠/唤醒逻辑 Composable
 * 职责: 管理宠物的睡眠状态、时间感知、自动唤醒
 * 
 * 睡眠触发条件:
 * - 深夜时段 (23:00 - 06:00)
 * - 长时间无互动 (> 30分钟)
 * - 用户主动让宠物睡觉
 * 
 * 唤醒触发条件:
 * - 用户主动唤醒
 * - 到达唤醒时间
 * - 检测到用户活动
 * 
 * HCDS Phase 4 扩展:
 * - 睡眠时记忆整理
 * - 每日摘要生成
 * - 深度睡眠时触发反思作业
 */
import { ref, computed, watch } from 'vue';
import { debugLog, logSuccess } from '@/utils/debugLog.js';

// 存储键
const STORAGE_KEY = 'PET_SLEEP_STATE';

// 睡眠配置
const SLEEP_CONFIG = {
    // 深夜时段（自动入睡）
    nightStart: 23,  // 23:00
    nightEnd: 6,     // 06:00

    // 无互动自动入睡（毫秒）
    idleThreshold: 30 * 60 * 1000,  // 30分钟

    // 睡眠心情恢复速率（每分钟）
    moodRecoveryRate: 1,

    // 最大睡眠时长（毫秒）
    maxSleepDuration: 8 * 60 * 60 * 1000  // 8小时
};

// ========== Composable ==========
export function useSleepWake(options = {}) {
    const {
        onSleep,
        onWake,
        onDream,
        // HCDS Phase 4: 反思系统和记忆系统实例
        reflectionInstance = null,
        memoryInstance = null,
        growthInstance = null
    } = options;

    // 状态
    const isSleeping = ref(false);
    const sleepStartTime = ref(0);
    const lastInteractionTime = ref(Date.now());
    const dreamContent = ref(null);
    const isDeepSleep = ref(false);  // 深度睡眠模式
    const reflectionJobDone = ref(false);  // 反思作业是否完成

    // 计时器
    let wakeCheckInterval = null;
    let dreamInterval = null;
    let deepSleepTimer = null;

    // ========== 核心方法 ==========

    /**
     * 开始睡眠
     * @param {string} reason - 睡眠原因
     */
    const startSleep = (reason = 'manual') => {
        if (isSleeping.value) return;

        isSleeping.value = true;
        sleepStartTime.value = Date.now();
        reflectionJobDone.value = false;

        debugLog('[Sleep] 开始睡眠, 原因:', reason);

        // 保存状态
        saveSleepState();

        // 启动唤醒检查
        startWakeCheck();

        // 启动做梦机制（可选）
        startDreamCycle();

        // HCDS Phase 4: 30分钟后进入深度睡眠，触发反思作业
        scheduleDeepSleep();

        if (onSleep) {
            onSleep({ reason, time: sleepStartTime.value });
        }
    };

    /**
     * HCDS Phase 4: 调度深度睡眠
     * 睡眠30分钟后进入深度睡眠，触发记忆整理
     */
    const scheduleDeepSleep = () => {
        deepSleepTimer = setTimeout(async () => {
            if (isSleeping.value && !reflectionJobDone.value) {
                isDeepSleep.value = true;
                debugLog('[Sleep] 进入深度睡眠，开始记忆整理...');

                await runReflectionJob();

                reflectionJobDone.value = true;
                logSuccess('睡眠反思作业完成');
            }
        }, 30 * 60 * 1000);  // 30分钟后
    };

    /**
     * HCDS Phase 4: 执行反思作业
     * 在深度睡眠时整理记忆、生成摘要
     */
    const runReflectionJob = async () => {
        debugLog('[Sleep] 执行反思作业...');

        try {
            // 1. 生成每日摘要（如果有反思系统）
            if (reflectionInstance && growthInstance) {
                const todayData = {
                    studyTime: growthInstance.todayStudyTime?.value || 0,
                    idleTime: growthInstance.todayIdleTime?.value || 0,
                    level: growthInstance.petLevel?.value || 1,
                    mood: growthInstance.mood?.value || 50
                };

                reflectionInstance.generateDailySummary(todayData);
                debugLog('[Sleep] 每日摘要已生成');
            }

            // 2. 记忆整理（如果有记忆系统）
            if (memoryInstance) {
                // 获取统计信息
                const stats = memoryInstance.getStats();
                debugLog('[Sleep] 记忆统计:', stats);

                // 知识图谱清理（移除过旧的三元组）
                if (memoryInstance.knowledgeGraph) {
                    const oldTriplesCount = memoryInstance.knowledgeGraph.value.length;
                    // 保留最近100条三元组
                    if (oldTriplesCount > 100) {
                        memoryInstance.knowledgeGraph.value =
                            memoryInstance.knowledgeGraph.value.slice(-100);
                        debugLog(`[Sleep] 知识图谱整理: ${oldTriplesCount} -> 100`);
                    }
                }
            }

            debugLog('[Sleep] 反思作业完成');
        } catch (error) {
            debugLog('[Sleep] 反思作业出错:', error);
        }
    };

    /**
     * 唤醒宠物
     * @param {string} reason - 唤醒原因
     * @returns {Object} 睡眠期间的恢复数据
     */
    const wakeUp = (reason = 'manual') => {
        if (!isSleeping.value) return null;

        const sleepDuration = Date.now() - sleepStartTime.value;
        const sleepMinutes = sleepDuration / 60000;

        // 计算心情恢复
        const moodRecovered = Math.min(
            Math.floor(sleepMinutes * SLEEP_CONFIG.moodRecoveryRate),
            30  // 最多恢复30点
        );

        // 重置状态
        isSleeping.value = false;
        sleepStartTime.value = 0;
        dreamContent.value = null;
        isDeepSleep.value = false;

        // 停止定时器
        stopWakeCheck();
        stopDreamCycle();
        stopDeepSleepTimer();

        // 清除保存的状态
        clearSleepState();

        debugLog('[Sleep] 唤醒, 原因:', reason,
            '睡眠时长:', Math.round(sleepMinutes), '分钟',
            '反思完成:', reflectionJobDone.value);

        const result = {
            reason,
            sleepDuration,
            sleepMinutes: Math.round(sleepMinutes),
            moodRecovered
        };

        if (onWake) {
            onWake(result);
        }

        return result;
    };

    /**
     * 记录互动时间
     */
    const recordInteraction = () => {
        lastInteractionTime.value = Date.now();

        // 如果在睡觉，轻度互动可能会唤醒
        if (isSleeping.value) {
            const sleepDuration = Date.now() - sleepStartTime.value;
            // 睡眠超过10分钟才能被互动唤醒
            if (sleepDuration > 10 * 60 * 1000) {
                wakeUp('interaction');
            }
        }
    };

    /**
     * 检查是否应该入睡
     * @returns {string|null} 入睡原因或null
     */
    const checkShouldSleep = () => {
        if (isSleeping.value) return null;

        const hour = new Date().getHours();

        // 检查深夜时段
        if (hour >= SLEEP_CONFIG.nightStart || hour < SLEEP_CONFIG.nightEnd) {
            return 'night_time';
        }

        // 检查无互动时长
        const idleDuration = Date.now() - lastInteractionTime.value;
        if (idleDuration > SLEEP_CONFIG.idleThreshold) {
            return 'idle_timeout';
        }

        return null;
    };

    /**
     * 检查是否应该唤醒
     * @returns {string|null} 唤醒原因或null
     */
    const checkShouldWake = () => {
        if (!isSleeping.value) return null;

        const hour = new Date().getHours();
        const sleepDuration = Date.now() - sleepStartTime.value;

        // 已经是白天且睡眠时间足够
        if (hour >= SLEEP_CONFIG.nightEnd && hour < SLEEP_CONFIG.nightStart) {
            if (sleepDuration > 60 * 60 * 1000) {  // 至少睡1小时
                return 'morning';
            }
        }

        // 睡眠时间过长
        if (sleepDuration > SLEEP_CONFIG.maxSleepDuration) {
            return 'max_duration';
        }

        return null;
    };

    // ========== 做梦机制 ==========

    /**
     * 生成梦境内容
     */
    const generateDream = () => {
        const dreams = [
            { emoji: '🌈', content: '梦到彩虹...' },
            { emoji: '🍖', content: '梦到美食...' },
            { emoji: '📚', content: '梦到主人在学习...' },
            { emoji: '🎮', content: '梦到和主人玩...' },
            { emoji: '☁️', content: '在云上飘...' },
            { emoji: '🌙', content: '数星星...' },
            { emoji: '💭', content: '模糊的梦...' }
        ];

        dreamContent.value = dreams[Math.floor(Math.random() * dreams.length)];

        if (onDream) {
            onDream(dreamContent.value);
        }
    };

    const startDreamCycle = () => {
        dreamInterval = setInterval(generateDream, 5 * 60 * 1000);  // 每5分钟
        generateDream();  // 立即生成一次
    };

    const stopDreamCycle = () => {
        if (dreamInterval) {
            clearInterval(dreamInterval);
            dreamInterval = null;
        }
    };

    // ========== 定时检查 ==========

    const startWakeCheck = () => {
        wakeCheckInterval = setInterval(() => {
            const wakeReason = checkShouldWake();
            if (wakeReason) {
                wakeUp(wakeReason);
            }
        }, 60 * 1000);  // 每分钟检查
    };

    const stopWakeCheck = () => {
        if (wakeCheckInterval) {
            clearInterval(wakeCheckInterval);
            wakeCheckInterval = null;
        }
    };

    const stopDeepSleepTimer = () => {
        if (deepSleepTimer) {
            clearTimeout(deepSleepTimer);
            deepSleepTimer = null;
        }
    };

    // ========== 存储相关 ==========

    const saveSleepState = () => {
        uni.setStorageSync(STORAGE_KEY, {
            isSleeping: isSleeping.value,
            sleepStartTime: sleepStartTime.value
        });
    };

    const loadSleepState = () => {
        try {
            const data = uni.getStorageSync(STORAGE_KEY);
            if (data && data.isSleeping) {
                isSleeping.value = true;
                sleepStartTime.value = data.sleepStartTime;

                // 检查是否应该唤醒
                const wakeReason = checkShouldWake();
                if (wakeReason) {
                    wakeUp(wakeReason);
                } else {
                    startWakeCheck();
                    startDreamCycle();
                }
            }
        } catch (e) {
            debugLog('[Sleep] 加载状态失败:', e);
        }
    };

    const clearSleepState = () => {
        uni.removeStorageSync(STORAGE_KEY);
    };

    // 计算属性
    const sleepDurationMinutes = computed(() => {
        if (!isSleeping.value || !sleepStartTime.value) return 0;
        return Math.round((Date.now() - sleepStartTime.value) / 60000);
    });

    const isNightTime = computed(() => {
        const hour = new Date().getHours();
        return hour >= SLEEP_CONFIG.nightStart || hour < SLEEP_CONFIG.nightEnd;
    });

    return {
        // 状态
        isSleeping,
        sleepStartTime,
        dreamContent,
        isDeepSleep,  // HCDS Phase 4
        reflectionJobDone,  // HCDS Phase 4
        // 计算属性
        sleepDurationMinutes,
        isNightTime,
        // 方法
        startSleep,
        wakeUp,
        recordInteraction,
        checkShouldSleep,
        checkShouldWake,
        loadSleepState,
        runReflectionJob,  // HCDS Phase 4: 手动触发反思
        // 配置
        SLEEP_CONFIG
    };
}
