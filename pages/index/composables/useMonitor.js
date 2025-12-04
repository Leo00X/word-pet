/**
 * 应用监控 Composable
 * 负责监控用户正在使用的应用并触发相应反馈
 */
import { ref } from 'vue';
import { getAppName } from '../utils/appMapper.js';

export function useMonitor(options = {}) {
    const {
        onPermissionDenied,  // 权限不足回调
        onGoodApp,           // 检测到白名单应用回调
        onBadApp,            // 检测到黑名单应用回调
        onUnknownApp,        // 检测到未知应用回调
        addLog               // 添加日志回调
    } = options;

    // 状态
    const isMonitoring = ref(false);
    const monitorIntervalTime = ref(3000);
    const lastPackage = ref("");
    const monitorInterval = ref(null);

    /**
     * 检测当前正在使用的应用
     */
    const checkCurrentApp = () => {
        try {
            const context = plus.android.runtimeMainActivity();
            const UsageStatsManager = plus.android.importClass("android.app.usage.UsageStatsManager");
            const Context = plus.android.importClass("android.content.Context");
            const System = plus.android.importClass("java.lang.System");
            const manager = context.getSystemService(Context.USAGE_STATS_SERVICE);

            if (!manager) return;

            const endTime = System.currentTimeMillis();
            const startTime = endTime - 10000;
            const statsList = manager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startTime, endTime);

            const size = plus.android.invoke(statsList, "size");

            if (size > 0) {
                let currentPackage = "";
                let lastTime = 0;

                for (let i = 0; i < size; i++) {
                    const stats = plus.android.invoke(statsList, "get", i);
                    const timeObj = plus.android.invoke(stats, "getLastTimeUsed");
                    const pkgObj = plus.android.invoke(stats, "getPackageName");

                    if (timeObj > lastTime) {
                        lastTime = timeObj;
                        currentPackage = pkgObj;
                    }
                }

                // 排除桌面启动器
                if (currentPackage &&
                    currentPackage.indexOf("launcher") === -1 &&
                    currentPackage.indexOf("home") === -1) {

                    if (lastPackage.value !== currentPackage) {
                        if (addLog) addLog("检测到应用切换: " + currentPackage);
                        lastPackage.value = currentPackage;

                        // 获取用户配置的黑白名单
                        const whitelist = uni.getStorageSync('pet_whitelist') || [];
                        const blacklist = uni.getStorageSync('pet_blacklist') || [];
                        const appName = getAppName(currentPackage);

                        // --- 规则判定 ---
                        if (whitelist.includes(currentPackage)) {
                            // ✅ 白名单 (学习软件)
                            if (addLog) addLog(`>>> 正在学习: ${appName} (经验+10)`);
                            if (onGoodApp) onGoodApp(appName, currentPackage);

                        } else if (blacklist.includes(currentPackage)) {
                            // ❌ 黑名单 (娱乐软件)
                            if (addLog) addLog(`>>> 警告: 正在摸鱼 ${appName} (心情-10)`);
                            if (onBadApp) onBadApp(appName, currentPackage);

                        } else {
                            // ⚠️ 未知应用 (中立)
                            if (addLog) addLog(`>>> 正在使用: ${appName}`);
                            if (onUnknownApp) onUnknownApp(appName, currentPackage);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Monitor tick error:", e);
        }
    };

    /**
     * 启动监控
     * @param {boolean} hasPermission - 是否有使用统计权限
     */
    const startMonitor = (hasPermission) => {
        if (!hasPermission) {
            if (addLog) addLog("错误: 缺少监控权限");
            if (onPermissionDenied) onPermissionDenied('usage');
            return;
        }

        isMonitoring.value = true;
        if (addLog) addLog(`监控: 已开启 (频率: ${monitorIntervalTime.value}ms)`);

        checkCurrentApp();
        monitorInterval.value = setInterval(() => {
            checkCurrentApp();
        }, monitorIntervalTime.value);
    };

    /**
     * 停止监控
     */
    const stopMonitor = () => {
        if (monitorInterval.value) {
            clearInterval(monitorInterval.value);
            monitorInterval.value = null;
        }
        isMonitoring.value = false;
        if (addLog) addLog("监控: 已停止");
    };

    /**
     * 切换监控状态
     * @param {boolean} hasPermission - 是否有权限
     */
    const toggleMonitor = (hasPermission) => {
        if (isMonitoring.value) {
            stopMonitor();
        } else {
            startMonitor(hasPermission);
        }
    };

    /**
     * 更新监控间隔
     * @param {number} time - 新的间隔时间（毫秒）
     */
    const updateMonitorInterval = (time) => {
        monitorIntervalTime.value = time;
        if (addLog) addLog(`配置更新: 扫描间隔 -> ${time}ms`);

        // 重启监控以应用新频率
        if (isMonitoring.value) {
            clearInterval(monitorInterval.value);
            monitorInterval.value = setInterval(() => {
                checkCurrentApp();
            }, monitorIntervalTime.value);
        }
    };

    return {
        // 状态
        isMonitoring,
        monitorIntervalTime,
        lastPackage,

        // 方法
        toggleMonitor,
        startMonitor,
        stopMonitor,
        checkCurrentApp,
        updateMonitorInterval
    };
}
