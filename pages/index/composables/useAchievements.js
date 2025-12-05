/**
 * 成就系统 Composable
 * 管理成就解锁、存储和检测
 */
import { ref, computed } from 'vue';
import { ACHIEVEMENTS, getAchievementById } from '../utils/achievementList.js';

export function useAchievements() {
    // 已解锁成就ID列表
    const unlockedIds = ref([]);

    // 最新解锁的成就（用于显示动画）
    const latestUnlock = ref(null);

    /**
     * 从本地存储加载数据
     */
    const loadData = () => {
        try {
            const saved = uni.getStorageSync('pet_achievements') || [];
            unlockedIds.value = saved;
        } catch (e) {
            console.error('加载成就数据失败:', e);
        }
    };

    /**
     * 保存成就数据
     */
    const saveData = () => {
        try {
            uni.setStorageSync('pet_achievements', unlockedIds.value);
        } catch (e) {
            console.error('保存成就数据失败:', e);
        }
    };

    /**
     * 检查成就是否已解锁
     */
    const isUnlocked = (achievementId) => {
        return unlockedIds.value.includes(achievementId);
    };

    /**
     * 解锁成就
     * @returns {Object|null} 解锁的成就，或 null
     */
    const unlock = (achievementId) => {
        if (isUnlocked(achievementId)) return null;

        const achievement = getAchievementById(achievementId);
        if (!achievement) return null;

        unlockedIds.value.push(achievementId);
        latestUnlock.value = achievement;
        saveData();

        return achievement;
    };

    /**
     * 检查并解锁满足条件的成就
     * @param {Object} stats - 当前统计数据
     * @returns {Array} 新解锁的成就列表
     */
    const checkAndUnlock = (stats) => {
        const newlyUnlocked = [];

        for (const achievement of ACHIEVEMENTS) {
            if (isUnlocked(achievement.id)) continue;

            const { type, value } = achievement.condition;
            let shouldUnlock = false;

            switch (type) {
                case 'total_study':
                    shouldUnlock = (stats.totalStudyTime || 0) >= value;
                    break;
                case 'daily_study':
                    shouldUnlock = (stats.todayStudyTime || 0) >= value;
                    break;
                case 'total_idle':
                    shouldUnlock = (stats.totalIdleTime || 0) >= value;
                    break;
                case 'chat_count':
                    shouldUnlock = (stats.chatCount || 0) >= value;
                    break;
                case 'pet_level':
                    shouldUnlock = (stats.petLevel || 1) >= value;
                    break;
                case 'reform':
                    // 特殊：摸鱼后学习，需要外部触发
                    break;
            }

            if (shouldUnlock) {
                const unlocked = unlock(achievement.id);
                if (unlocked) {
                    newlyUnlocked.push(unlocked);
                }
            }
        }

        return newlyUnlocked;
    };

    /**
     * 清除最新解锁提示
     */
    const clearLatestUnlock = () => {
        latestUnlock.value = null;
    };

    /**
     * 获取所有成就及其解锁状态
     */
    const allAchievements = computed(() => {
        return ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked: isUnlocked(a.id)
        }));
    });

    /**
     * 获取解锁进度
     */
    const progress = computed(() => {
        return {
            unlocked: unlockedIds.value.length,
            total: ACHIEVEMENTS.length,
            percent: Math.round((unlockedIds.value.length / ACHIEVEMENTS.length) * 100)
        };
    });

    return {
        unlockedIds,
        latestUnlock,
        allAchievements,
        progress,
        loadData,
        isUnlocked,
        unlock,
        checkAndUnlock,
        clearLatestUnlock
    };
}
