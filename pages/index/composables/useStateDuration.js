/**
 * 状态持续时间追踪器 Composable
 * 职责: 追踪宠物状态的持续时间，提供状态统计数据
 * 
 * 遵循 Bug 防范指南：
 * - 功能闭环：所有方法都有调用点
 * - 数据结构一致：统一的时间戳格式
 */
import { ref, computed } from 'vue';
import { debugLog } from '@/utils/debugLog.js';

// 存储键
const STORAGE_KEY = 'PET_STATE_DURATION_STATS';

// ========== Composable ==========
export function useStateDuration() {
    // 状态历史记录
    const stateHistory = ref([]);

    // 当前状态信息
    const currentStateInfo = ref({
        state: null,
        subState: null,
        startTime: 0,
        metadata: {}
    });

    // 今日统计
    const todayStats = ref({
        idleMinutes: 0,
        interactionCount: 0,
        angryMinutes: 0,
        sleepMinutes: 0,
        lastResetDate: ''
    });

    // ========== 核心方法 ==========

    /**
     * 开始追踪新状态
     * @param {string} state - 根状态
     * @param {string} subState - 子状态
     * @param {Object} metadata - 额外信息
     */
    const startTracking = (state, subState = null, metadata = {}) => {
        // 先结束上一个状态的追踪
        if (currentStateInfo.value.state) {
            endTracking();
        }

        currentStateInfo.value = {
            state,
            subState,
            startTime: Date.now(),
            metadata
        };

        debugLog('[Duration] 开始追踪:', state, subState);
    };

    /**
     * 结束当前状态追踪
     * @returns {Object} 结束的状态信息
     */
    const endTracking = () => {
        const info = currentStateInfo.value;
        if (!info.state || !info.startTime) return null;

        const duration = Date.now() - info.startTime;

        // 记录到历史
        const record = {
            state: info.state,
            subState: info.subState,
            startTime: info.startTime,
            endTime: Date.now(),
            duration,
            metadata: info.metadata
        };

        stateHistory.value.push(record);

        // 只保留最近100条记录
        if (stateHistory.value.length > 100) {
            stateHistory.value = stateHistory.value.slice(-100);
        }

        // 更新今日统计
        updateDailyStats(info.state, duration);

        debugLog('[Duration] 结束追踪:', info.state, '持续', Math.round(duration / 1000), '秒');

        // 重置当前状态
        currentStateInfo.value = { state: null, subState: null, startTime: 0, metadata: {} };

        return record;
    };

    /**
     * 更新每日统计
     */
    const updateDailyStats = (state, durationMs) => {
        const minutes = durationMs / 60000;

        switch (state) {
            case 'IDLE':
                todayStats.value.idleMinutes += minutes;
                break;
            case 'INTERACTION':
                todayStats.value.interactionCount++;
                break;
            case 'ANGRY':
                todayStats.value.angryMinutes += minutes;
                break;
            case 'SLEEPING':
                todayStats.value.sleepMinutes += minutes;
                break;
        }

        saveStats();
    };

    /**
     * 获取当前状态持续时间(毫秒)
     */
    const getCurrentDuration = () => {
        if (!currentStateInfo.value.startTime) return 0;
        return Date.now() - currentStateInfo.value.startTime;
    };

    /**
     * 获取状态统计摘要
     */
    const getStatsSummary = () => {
        const recentHistory = stateHistory.value.slice(-20);

        const summary = {
            totalRecords: stateHistory.value.length,
            recentStates: recentHistory.map(r => ({
                state: r.state,
                duration: Math.round(r.duration / 1000)
            })),
            today: { ...todayStats.value },
            averageDuration: {}
        };

        // 计算各状态平均持续时间
        const stateGroups = {};
        stateHistory.value.forEach(r => {
            if (!stateGroups[r.state]) stateGroups[r.state] = [];
            stateGroups[r.state].push(r.duration);
        });

        Object.keys(stateGroups).forEach(state => {
            const durations = stateGroups[state];
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            summary.averageDuration[state] = Math.round(avg / 1000);
        });

        return summary;
    };

    // ========== 存储相关 ==========

    /**
     * 保存统计数据
     */
    const saveStats = () => {
        try {
            uni.setStorageSync(STORAGE_KEY, {
                history: stateHistory.value.slice(-50), // 只保存最近50条
                todayStats: todayStats.value
            });
        } catch (e) {
            debugLog('[Duration] 保存失败:', e);
        }
    };

    /**
     * 加载统计数据
     */
    const loadStats = () => {
        try {
            const data = uni.getStorageSync(STORAGE_KEY);
            if (data) {
                stateHistory.value = data.history || [];
                todayStats.value = data.todayStats || todayStats.value;

                // 检查是否需要重置每日统计
                checkDailyReset();
            }
        } catch (e) {
            debugLog('[Duration] 加载失败:', e);
        }
    };

    /**
     * 检查并重置每日统计
     */
    const checkDailyReset = () => {
        const today = new Date().toDateString();
        if (todayStats.value.lastResetDate !== today) {
            todayStats.value = {
                idleMinutes: 0,
                interactionCount: 0,
                angryMinutes: 0,
                sleepMinutes: 0,
                lastResetDate: today
            };
            saveStats();
        }
    };

    // 计算属性
    const currentDurationSeconds = computed(() => {
        return Math.round(getCurrentDuration() / 1000);
    });

    const currentState = computed(() => currentStateInfo.value.state);

    return {
        // 状态
        stateHistory,
        currentStateInfo,
        todayStats,
        // 计算属性
        currentDurationSeconds,
        currentState,
        // 方法
        startTracking,
        endTracking,
        getCurrentDuration,
        getStatsSummary,
        loadStats,
        saveStats,
        checkDailyReset
    };
}
