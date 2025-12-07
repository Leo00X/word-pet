/**
 * 反思系统 Composable
 * 职责: 分析用户行为模式、生成洞察、触发主动对话
 * 
 * PMRA Loop 的 R (Reflection) 层
 * 
 * 功能:
 * - 行为模式分析（什么时候容易摸鱼？）
 * - 每日摘要生成
 * - 洞察提取（学习习惯、进步趋势）
 * - 主动对话触发建议
 */

import { ref, computed } from 'vue';
import { logSuccess, logError } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const STORAGE_KEY = 'reflection_data';
const MAX_INSIGHTS = 20;  // 最大保留洞察数

// 洞察类型
const INSIGHT_TYPES = {
    PATTERN: 'pattern',      // 行为模式
    PROGRESS: 'progress',    // 进步趋势
    WARNING: 'warning',      // 警告提醒
    SUGGESTION: 'suggestion' // 建议
};

/**
 * 反思系统
 */
export function useReflection() {
    // ========== 响应式状态 ==========

    // 洞察列表
    const insights = ref([]);

    // 每日摘要
    const dailySummaries = ref([]);

    // 行为统计（用于模式识别）
    const behaviorStats = ref({
        studyByHour: {},      // 每小时学习时长
        idleByHour: {},       // 每小时摸鱼时长
        studyByDayOfWeek: {}, // 每周几学习时长
        consecutiveIdleDays: 0,
        consecutiveStudyDays: 0,
        lastReflectionDate: null
    });

    // ========== 计算属性 ==========

    /**
     * 最近的洞察
     */
    const recentInsights = computed(() => {
        return insights.value.slice(-5);
    });

    /**
     * 是否需要反思（每天一次）
     */
    const shouldReflect = computed(() => {
        const today = new Date().toDateString();
        return behaviorStats.value.lastReflectionDate !== today;
    });

    // ========== 核心方法 ==========

    /**
     * 加载数据
     */
    function loadData() {
        try {
            const saved = uni.getStorageSync(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                insights.value = data.insights || [];
                dailySummaries.value = data.dailySummaries || [];
                behaviorStats.value = { ...behaviorStats.value, ...data.behaviorStats };
            }
        } catch (err) {
            logError('useReflection', '加载反思数据失败', err);
        }
    }

    /**
     * 保存数据
     */
    function saveData() {
        try {
            const data = {
                insights: insights.value,
                dailySummaries: dailySummaries.value,
                behaviorStats: behaviorStats.value
            };
            uni.setStorageSync(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            logError('useReflection', '保存反思数据失败', err);
        }
    }

    /**
     * 记录行为事件（供感知层调用）
     * @param {string} type - 事件类型 'study' | 'idle'
     * @param {number} duration - 持续时间（分钟）
     */
    function recordBehavior(type, duration) {
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();

        if (type === 'study') {
            // 按小时统计
            behaviorStats.value.studyByHour[hour] =
                (behaviorStats.value.studyByHour[hour] || 0) + duration;
            // 按周几统计
            behaviorStats.value.studyByDayOfWeek[dayOfWeek] =
                (behaviorStats.value.studyByDayOfWeek[dayOfWeek] || 0) + duration;
        } else if (type === 'idle') {
            behaviorStats.value.idleByHour[hour] =
                (behaviorStats.value.idleByHour[hour] || 0) + duration;
        }

        saveData();
    }

    /**
     * 分析行为模式
     * @returns {Array} 发现的模式
     */
    function analyzePatterns() {
        const patterns = [];
        const stats = behaviorStats.value;

        // 分析最容易摸鱼的时间段
        const idleHours = Object.entries(stats.idleByHour)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (idleHours.length > 0) {
            const peakHour = idleHours[0][0];
            patterns.push({
                type: INSIGHT_TYPES.PATTERN,
                content: `你在 ${peakHour}:00 左右最容易开小差`,
                data: { peakIdleHour: peakHour, duration: idleHours[0][1] }
            });
        }

        // 分析学习高峰期
        const studyHours = Object.entries(stats.studyByHour)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (studyHours.length > 0) {
            const peakHour = studyHours[0][0];
            patterns.push({
                type: INSIGHT_TYPES.PATTERN,
                content: `你在 ${peakHour}:00 左右学习效率最高`,
                data: { peakStudyHour: peakHour, duration: studyHours[0][1] }
            });
        }

        // 分析周几学习最多
        const studyDays = Object.entries(stats.studyByDayOfWeek)
            .sort((a, b) => b[1] - a[1]);

        if (studyDays.length > 0) {
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const bestDay = dayNames[studyDays[0][0]];
            patterns.push({
                type: INSIGHT_TYPES.PATTERN,
                content: `你每周 ${bestDay} 学习最努力`,
                data: { bestStudyDay: studyDays[0][0] }
            });
        }

        return patterns;
    }

    /**
     * 生成每日摘要
     * @param {Object} todayData - 今日数据 { studyTime, idleTime, level, mood }
     * @returns {Object} 摘要对象
     */
    function generateDailySummary(todayData) {
        const today = new Date().toDateString();

        // 检查是否已生成
        if (behaviorStats.value.lastReflectionDate === today) {
            return dailySummaries.value[dailySummaries.value.length - 1];
        }

        const summary = {
            date: today,
            timestamp: Date.now(),
            studyTime: todayData.studyTime || 0,
            idleTime: todayData.idleTime || 0,
            level: todayData.level || 1,
            mood: todayData.mood || 50,
            insights: []
        };

        // 生成洞察
        if (summary.studyTime > 60) {
            summary.insights.push({
                type: INSIGHT_TYPES.PROGRESS,
                content: `今天学习超过1小时，太棒了！`
            });
        }

        if (summary.idleTime > summary.studyTime * 2) {
            summary.insights.push({
                type: INSIGHT_TYPES.WARNING,
                content: `今天摸鱼时间是学习的2倍以上，要注意哦`
            });
        }

        if (summary.mood > 80) {
            summary.insights.push({
                type: INSIGHT_TYPES.PROGRESS,
                content: `心情很好！继续保持`
            });
        } else if (summary.mood < 30) {
            summary.insights.push({
                type: INSIGHT_TYPES.SUGGESTION,
                content: `心情不太好，多休息休息吧`
            });
        }

        // 保存摘要
        dailySummaries.value.push(summary);
        if (dailySummaries.value.length > 30) {
            dailySummaries.value.shift();  // 只保留30天
        }

        // 更新最后反思日期
        behaviorStats.value.lastReflectionDate = today;

        // 添加洞察到列表
        summary.insights.forEach(insight => addInsight(insight));

        saveData();
        logSuccess(`生成每日摘要: ${today}`);

        return summary;
    }

    /**
     * 添加洞察
     * @param {Object} insight - 洞察对象
     */
    function addInsight(insight) {
        const newInsight = {
            id: `insight_${Date.now()}`,
            timestamp: Date.now(),
            ...insight
        };

        insights.value.push(newInsight);

        // 限制数量
        if (insights.value.length > MAX_INSIGHTS) {
            insights.value.shift();
        }

        saveData();
    }

    /**
     * 获取主动对话建议
     * @param {Object} context - 当前上下文
     * @returns {Object|null} 建议的对话触发
     */
    function getProactiveChatSuggestion(context) {
        const { mood, studyTime, idleTime, lastChatTime } = context;
        const now = Date.now();
        const hoursSinceLastChat = (now - (lastChatTime || 0)) / (1000 * 60 * 60);

        // 如果3小时内聊过，不主动打扰
        if (hoursSinceLastChat < 3) {
            return null;
        }

        // 场景1: 连续学习超过1小时
        if (studyTime > 60) {
            return {
                trigger: 'long_study',
                message: '学习这么久了，要不要休息一下？',
                emotion: 'caring'
            };
        }

        // 场景2: 心情很低
        if (mood < 25) {
            return {
                trigger: 'low_mood',
                message: '看你心情不太好...还好吗？',
                emotion: 'concerned'
            };
        }

        // 场景3: 连续摸鱼超过30分钟
        if (idleTime > 30 && studyTime < 5) {
            return {
                trigger: 'idle_warning',
                message: '又在摸鱼了？！',
                emotion: 'angry'
            };
        }

        return null;
    }

    /**
     * 获取统计信息
     */
    function getStats() {
        return {
            totalInsights: insights.value.length,
            totalSummaries: dailySummaries.value.length,
            lastReflection: behaviorStats.value.lastReflectionDate,
            patterns: analyzePatterns()
        };
    }

    /**
     * 构建反思 Prompt（用于AI对话）
     */
    function buildReflectionPrompt() {
        const patterns = analyzePatterns();
        const recent = recentInsights.value;

        if (patterns.length === 0 && recent.length === 0) {
            return '';
        }

        const parts = ['# 用户行为洞察'];

        patterns.forEach(p => {
            parts.push(`- ${p.content}`);
        });

        if (recent.length > 0) {
            parts.push('\n# 最近观察');
            recent.forEach(i => {
                parts.push(`- ${i.content}`);
            });
        }

        return parts.join('\n');
    }

    // ========== 初始化 ==========
    loadData();

    // ========== 返回公开API ==========
    return {
        // 状态
        insights,
        dailySummaries,
        behaviorStats,
        recentInsights,
        shouldReflect,

        // 核心方法
        recordBehavior,
        analyzePatterns,
        generateDailySummary,
        getProactiveChatSuggestion,
        buildReflectionPrompt,

        // 数据管理
        addInsight,
        loadData,
        saveData,
        getStats
    };
}
