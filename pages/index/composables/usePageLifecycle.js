/**
 * 页面生命周期管理 Composable
 * 职责: 管理页面初始化、每日重置、问候检查等生命周期相关逻辑
 * 
 * 从 index.vue 提取，遵循 Index净化协议
 */
import { computed } from 'vue';
import { logUserAction } from '@/utils/debugLog.js';
import {
    shouldShowDailyGreeting,
    markDailyGreetingShown,
    getTimeBasedGreeting,
    savePendingGreeting
} from './useGreeting.js';

/**
 * 页面生命周期管理
 * @param {Object} deps - 依赖注入
 */
export function usePageLifecycle(deps) {
    const {
        permissions,
        floatWindow,
        growth,
        growthLog,
        chat,
        achievements,
        getChatCount  // 函数，返回今日聊天次数
    } = deps;

    /**
     * 检查是否跨天并重置每日统计
     */
    const checkAndResetDailyStats = () => {
        const today = new Date().toDateString();
        const lastResetDate = uni.getStorageSync('last_reset_date') || '';

        if (lastResetDate !== today) {
            growth.resetDailyStats();
            uni.setStorageSync('last_reset_date', today);
            growthLog.addGrowthLog('🌅 新的一天开始了！', 0);
        }
    };

    /**
     * 检查并发送每日问候
     */
    const checkDailyGreeting = () => {
        if (!shouldShowDailyGreeting()) return;

        markDailyGreetingShown();

        setTimeout(() => {
            const greeting = getTimeBasedGreeting();

            // 添加到聊天记录
            chat.addMessage('pet', greeting, { type: 'greeting', emotion: 'happy' });

            // 处理悬浮窗
            if (floatWindow.isPetShown.value) {
                floatWindow.sendMessageToFloat(1, greeting);
            } else {
                savePendingGreeting(greeting);
            }
        }, 1500);
    };

    /**
     * 检查并解锁成就
     */
    const checkAchievements = () => {
        const stats = {
            totalStudyTime: growth.totalStudyTime.value,
            todayStudyTime: growth.todayStudyTime.value,
            totalIdleTime: growth.totalIdleTime.value,
            chatCount: getChatCount(),
            petLevel: growth.petLevel.value
        };

        const newlyUnlocked = achievements.checkAndUnlock(stats);

        if (newlyUnlocked.length > 0) {
            newlyUnlocked.forEach(achievement => {
                uni.showToast({
                    title: `🏆 解锁: ${achievement.name}`,
                    icon: 'none',
                    duration: 2500
                });

                // 发放奖励
                if (achievement.reward) {
                    growth.changeCoins(achievement.reward.coins || 0);
                    growth.addXP(achievement.reward.exp || 0);
                }
            });
        }
    };

    /**
     * 页面初始化（在 onShow 中调用）
     */
    const initializePage = () => {
        logUserAction('页面显示', {
            isPetShown: floatWindow.isPetShown.value,
            isMonitoring: false // 由外部传入
        });

        // 检查权限状态
        permissions.checkPermissions();

        // 恢复悬浮窗实例
        floatWindow.reinitInstance();

        // 加载成长数据
        growth.loadData();

        // 检查跨天重置
        checkAndResetDailyStats();

        // 加载相关数据
        growthLog.loadCachedData();
        chat.loadMessages();
        achievements.loadData();

        // 每日问候
        checkDailyGreeting();

        // 延迟检查成就
        setTimeout(() => checkAchievements(), 500);
    };

    return {
        initializePage,
        checkDailyGreeting,
        checkAchievements,
        checkAndResetDailyStats
    };
}
