/**
 * 应用监控 Composable
 * 负责监控用户正在使用的应用并触发相应反馈
 */
import { ref } from 'vue';
import { getAppName } from '../utils/appMapper.js';

export function useMonitor(options = {}) {
    const {
        // 可选:集成成长系统和AI系统(减少回调地狱)
        useGrowthIntegration = null,  // useGrowth 实例
        useGrowthLogIntegration = null, // useGrowthLog 实例 (记录日志)
        useAIIntegration = null,      // useAI 实例
        sendToFloat = null,           // 发送消息到悬浮窗的函数

        // 传统回调方式(向后兼容)
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
                            handleGoodApp(appName, currentPackage);

                        } else if (blacklist.includes(currentPackage)) {
                            // ❌ 黑名单 (娱乐软件)
                            handleBadApp(appName, currentPackage);

                        } else {
                            // ⚠️ 未知应用 (中立)
                            handleUnknownApp(appName, currentPackage);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Monitor tick error:", e);
        }
    };

    /**
     * 处理白名单应用(学习软件)
     */
    const handleGoodApp = (appName, packageName) => {
        if (addLog) addLog(`>>> 正在学习: ${appName} (经验+10)`);

        // 如果集成了成长系统,直接调用
        if (useGrowthIntegration) {
            const leveledUp = useGrowthIntegration.rewardStudy(10); // 10分钟学习奖励
            // 可以根据是否升级做额外处理
        }

        // 记录成长日志
        if (useGrowthLogIntegration) {
            useGrowthLogIntegration.addGrowthLog(`学习 (${appName})`, 10);
        }

        // 如果集成了AI系统,触发评论
        if (useAIIntegration && sendToFloat) {
            useAIIntegration.triggerPetComment(appName, 'good', sendToFloat, addLog);
        }

        // 兼容旧回调方式
        if (onGoodApp) onGoodApp(appName, packageName);
    };

    /**
     * 处理黑名单应用(娱乐软件)
     */
    const handleBadApp = (appName, packageName) => {
        if (addLog) addLog(`>>> 警告: 正在摸鱼 ${appName} (心情-10)`);

        // 如果集成了成长系统,直接调用
        if (useGrowthIntegration) {
            useGrowthIntegration.penaltyIdle(10); // 10分钟摸鱼惩罚
        }

        // 记录成长日志
        if (useGrowthLogIntegration) {
            useGrowthLogIntegration.addGrowthLog(`摸鱼 (${appName})`, -10);
        }

        // 如果集成了AI系统,触发毒舌评论
        if (useAIIntegration && sendToFloat) {
            useAIIntegration.triggerPetComment(appName, 'bad', sendToFloat, addLog);
        }

        // 兼容旧回调方式
        if (onBadApp) onBadApp(appName, packageName);
    };

    /**
     * 处理未知应用(中立)
     */
    const handleUnknownApp = (appName, packageName) => {
        if (addLog) addLog(`>>> 正在使用: ${appName}`);

        // 未知应用:轻微心情下降
        if (useGrowthIntegration) {
            useGrowthIntegration.changeMood(-1);
        }

        // 清除悬浮窗消息
        if (sendToFloat) {
            sendToFloat(3, "");
        }

        // 兼容旧回调方式
        if (onUnknownApp) onUnknownApp(appName, packageName);
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
