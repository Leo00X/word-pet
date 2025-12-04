/**
 * 宠物成长系统 Composable
 * 管理等级、经验、心情、饥饿度、亲密度、金币等数值
 */
import { ref, computed, watch } from 'vue';
import {
    getRequiredXP,
    levelUp,
    calculateStudyReward,
    calculateIdlePenalty,
    applyTimeDecay,
    clamp
} from '../utils/growthFormula.js';
import { getPetDisplay } from '../utils/petForms.js';

export function useGrowth() {
    // 核心数值
    const petType = ref('ghost'); // 宠物类型
    const petLevel = ref(1);
    const petXP = ref(0);
    const mood = ref(80);
    const coins = ref(128);
    const hunger = ref(100);
    const bond = ref(0);

    // 统计数据
    const totalStudyTime = ref(0);    // 总学习时长（分钟）
    const totalIdleTime = ref(0);     // 总摸鱼时长
    const todayStudyTime = ref(0);    // 今日学习时长
    const todayIdleTime = ref(0);     // 今日摸鱼时长
    const lastUpdateTime = ref(Date.now());

    // 计算属性
    const requiredXP = computed(() => getRequiredXP(petLevel.value));
    const xpProgress = computed(() => {
        const progress = (petXP.value / requiredXP.value) * 100;
        return Math.min(100, Math.max(0, progress));
    });

    // 宠物显示配置
    const petDisplay = computed(() => {
        return getPetDisplay(petType.value, petLevel.value, mood.value, bond.value);
    });

    /**
     * 从本地存储加载数据
     */
    const loadData = () => {
        try {
            petType.value = uni.getStorageSync('pet_type') || 'ghost';
            petLevel.value = uni.getStorageSync('pet_level') || 1;
            petXP.value = uni.getStorageSync('pet_xp') || 0;
            mood.value = uni.getStorageSync('pet_mood') || 80;
            coins.value = uni.getStorageSync('pet_coins') || 128;
            hunger.value = uni.getStorageSync('pet_hunger') || 100;
            bond.value = uni.getStorageSync('pet_bond') || 0;

            totalStudyTime.value = uni.getStorageSync('total_study_time') || 0;
            totalIdleTime.value = uni.getStorageSync('total_idle_time') || 0;
            todayStudyTime.value = uni.getStorageSync('today_study_time') || 0;
            todayIdleTime.value = uni.getStorageSync('today_idle_time') || 0;
            lastUpdateTime.value = uni.getStorageSync('last_update_time') || Date.now();

            // 检查是否需要应用时间衰减
            checkTimeDecay();
        } catch (e) {
            console.error('加载成长数据失败:', e);
        }
    };

    /**
     * 保存数据到本地存储
     */
    const saveData = () => {
        try {
            uni.setStorageSync('pet_type', petType.value);
            uni.setStorageSync('pet_level', petLevel.value);
            uni.setStorageSync('pet_xp', petXP.value);
            uni.setStorageSync('pet_mood', mood.value);
            uni.setStorageSync('pet_coins', coins.value);
            uni.setStorageSync('pet_hunger', hunger.value);
            uni.setStorageSync('pet_bond', bond.value);

            uni.setStorageSync('total_study_time', totalStudyTime.value);
            uni.setStorageSync('total_idle_time', totalIdleTime.value);
            uni.setStorageSync('today_study_time', todayStudyTime.value);
            uni.setStorageSync('today_idle_time', todayIdleTime.value);
            uni.setStorageSync('last_update_time', lastUpdateTime.value);

            // 兼容老版本（保持 pet_mood_cache）
            uni.setStorageSync('pet_mood_cache', mood.value);
        } catch (e) {
            console.error('保存成长数据失败:', e);
        }
    };

    /**
     * 检查并应用时间衰减
     */
    const checkTimeDecay = () => {
        const now = Date.now();
        const hoursPassed = (now - lastUpdateTime.value) / (1000 * 60 * 60);

        if (hoursPassed >= 1) {
            const hoursToApply = Math.floor(hoursPassed);
            for (let i = 0; i < hoursToApply; i++) {
                const decay = applyTimeDecay(mood.value, hunger.value);
                mood.value = decay.mood;
                hunger.value = decay.hunger;
            }
            lastUpdateTime.value = now;
            saveData();
        }
    };

    /**
     * 添加经验值
     * @param {number} xp - 经验值
     * @returns {boolean} 是否升级
     */
    const addXP = (xp) => {
        petXP.value += xp;
        const result = levelUp(petXP.value, petLevel.value);

        const didLevelUp = result.newLevel > petLevel.value;
        petLevel.value = result.newLevel;
        petXP.value = result.remainingXP;

        saveData();
        return didLevelUp;
    };

    /**
     * 修改心情值
     * @param {number} delta - 变化量
     */
    const changeMood = (delta) => {
        mood.value = clamp(mood.value + delta, 0, 100);
        saveData();
    };

    /**
     * 修改金币
     * @param {number} delta - 变化量
     */
    const changeCoins = (delta) => {
        coins.value = Math.max(0, coins.value + delta);
        saveData();
    };

    /**
     * 修改饥饿度
     * @param {number} delta - 变化量
     */
    const changeHunger = (delta) => {
        hunger.value = clamp(hunger.value + delta, 0, 100);
        saveData();
    };

    /**
     * 修改亲密度
     * @param {number} delta - 变化量
     */
    const changeBond = (delta) => {
        bond.value = clamp(bond.value + delta, 0, 100);
        saveData();
    };

    /**
     * 学习奖励
     * @param {number} durationMinutes - 学习时长（分钟）
     * @returns {Object} 奖励详情和是否升级
     */
    const rewardStudy = (durationMinutes) => {
        const reward = calculateStudyReward(durationMinutes);

        const didLevelUp = addXP(reward.xp);
        changeMood(reward.mood);
        changeCoins(reward.coins);

        totalStudyTime.value += durationMinutes;
        todayStudyTime.value += durationMinutes;
        saveData();

        return {
            ...reward,
            didLevelUp,
            newLevel: petLevel.value
        };
    };

    /**
     * 摸鱼惩罚
     * @param {number} durationMinutes - 摸鱼时长（分钟）
     * @returns {Object} 惩罚详情
     */
    const penaltyIdle = (durationMinutes) => {
        const penalty = calculateIdlePenalty(durationMinutes);

        changeMood(penalty.mood);
        changeCoins(penalty.coins);
        changeHunger(penalty.hunger);

        totalIdleTime.value += durationMinutes;
        todayIdleTime.value += durationMinutes;
        saveData();

        return penalty;
    };

    /**
     * 互动（点击宠物）
     * @returns {number} 亲密度增加量
     */
    const interact = () => {
        const bondIncrease = 1;
        const moodIncrease = 2;

        changeBond(bondIncrease);
        changeMood(moodIncrease);

        return bondIncrease;
    };

    /**
     * 喂食
     * @returns {number} 饥饿度恢复量
     */
    const feed = () => {
        const hungerRestore = 20;
        const coinCost = 10;

        if (coins.value < coinCost) {
            return 0; // 金币不足
        }

        changeHunger(hungerRestore);
        changeCoins(-coinCost);
        changeBond(1);

        return hungerRestore;
    };

    /**
     * 切换宠物类型
     * @param {string} newType - 新宠物类型 ID
     */
    const changePetType = (newType) => {
        petType.value = newType;
        saveData();
    };

    /**
     * 重置每日统计（应在每天0点调用）
     */
    const resetDailyStats = () => {
        todayStudyTime.value = 0;
        todayIdleTime.value = 0;
        saveData();
    };

    // 监听数值变化自动保存（防抖）
    let saveTimer = null;
    watch(
        [mood, hunger, bond],
        () => {
            if (saveTimer) clearTimeout(saveTimer);
            saveTimer = setTimeout(saveData, 500);
        }
    );

    return {
        // 数值状态
        petType,
        petLevel,
        petXP,
        mood,
        coins,
        hunger,
        bond,

        // 统计数据
        totalStudyTime,
        totalIdleTime,
        todayStudyTime,
        todayIdleTime,

        // 计算属性
        requiredXP,
        xpProgress,
        petDisplay,

        // 方法
        loadData,
        saveData,
        addXP,
        changeMood,
        changeCoins,
        changeHunger,
        changeBond,
        rewardStudy,
        penaltyIdle,
        interact,
        feed,
        changePetType,
        resetDailyStats,
        checkTimeDecay
    };
}
