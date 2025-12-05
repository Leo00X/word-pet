/**
 * 成长日志与游戏状态管理 Composable
 * 负责宠物数据、日志记录和本地存储
 */
import { ref } from 'vue';

export function useGrowthLog() {
    // 游戏数据
    const petLevel = ref(1);
    const coins = ref(128);
    const mood = ref(80);
    const exp = ref(45);
    const growthLogs = ref([]);

    /**
     * 加载缓存数据
     */
    const loadCachedData = () => {
        // 读取日志缓存（只显示最近3条）
        const fullLogs = uni.getStorageSync('pet_growth_logs') || [];
        growthLogs.value = fullLogs.slice(0, 3);

        // 读取心情缓存
        const cachedMood = uni.getStorageSync('pet_mood_cache');
        if (cachedMood !== '' && cachedMood !== null) {
            mood.value = cachedMood;
        }
    };

    /**
     * 添加成长日志
     * @param {string} msg - 日志消息
     * @param {number} val - 数值变化(正数增加,负数减少)
     */
    const addGrowthLog = (msg, val) => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const time = `${hours}:${minutes}:${seconds}`;
        const timestamp = Date.now();
        const newLog = { time, msg, val, timestamp };

        // 更新前端显示(只显示最近3条)
        growthLogs.value.unshift(newLog);
        if (growthLogs.value.length > 3) growthLogs.value.pop();

        try {
            // 持久化存储(保留最近500条)
            let history = uni.getStorageSync('pet_growth_logs') || [];
            history.unshift(newLog);
            if (history.length > 500) history = history.slice(0, 500);
            uni.setStorageSync('pet_growth_logs', history);

            // 同步保存心情值
            uni.setStorageSync('pet_mood_cache', mood.value);
        } catch (e) {
            console.error("日志存储失败", e);
        }
    };

    /**
     * 更新心情值
     * @param {number} delta - 变化量
     */
    const updateMood = (delta) => {
        mood.value = Math.max(0, Math.min(100, mood.value + delta));
        uni.setStorageSync('pet_mood_cache', mood.value);
    };

    /**
     * 更新经验值
     * @param {number} delta - 变化量
     */
    const updateExp = (delta) => {
        exp.value = Math.max(0, Math.min(100, exp.value + delta));
        // 可以在这里添加升级逻辑
        if (exp.value >= 100) {
            petLevel.value++;
            exp.value = 0;
            coins.value += 50; // 升级奖励
        }
    };

    return {
        // 状态
        petLevel,
        coins,
        mood,
        exp,
        growthLogs,

        // 方法
        loadCachedData,
        addGrowthLog,
        updateMood,
        updateExp
    };
}
