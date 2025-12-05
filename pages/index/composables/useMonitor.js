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
        useChatIntegration = null,    // useChat 实例 (同步消息到对话)
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

    // 追踪应用使用时长
    const lastAppStartTime = ref(null);
    const lastAppType = ref(null);
    const lastAppName = ref("");
    const lastAppPackage = ref("");  // 新增：记录包名用于统计

    // 应用使用统计 { packageName: { name, count, totalMinutes, type } }
    const appStats = ref({});

    /**
     * 获取应用显示名称（优先使用用户自定义的名称和备注）
     * @param {string} packageName - 应用包名
     * @returns {string} 显示名称
     */
    const getAppDisplayName = (packageName) => {
        // 1. 尝试读取用户自定义的元数据
        const appMetadata = uni.getStorageSync('pet_app_metadata') || {};
        const meta = appMetadata[packageName];

        if (meta) {
            // 优先使用自定义名称 + 备注
            if (meta.customName && meta.note) {
                return `${meta.customName}（${meta.note}）`;
            } else if (meta.customName) {
                return meta.customName;
            } else if (meta.note) {
                // 只有备注，则用原名+备注
                const baseName = getAppName(packageName);
                return `${baseName}（${meta.note}）`;
            }
        }

        // 2. 回退到 appMapper 获取名称
        return getAppName(packageName);
    };

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
                        // 应用切换了！先结算上一个应用的使用时长
                        settleLastAppUsage();

                        if (addLog) addLog("检测到应用切换: " + currentPackage);
                        lastPackage.value = currentPackage;

                        // 获取用户配置的黑白名单
                        const whitelist = uni.getStorageSync('pet_whitelist') || [];
                        const blacklist = uni.getStorageSync('pet_blacklist') || [];

                        // 获取应用显示名称（优先自定义名称和备注）
                        const displayName = getAppDisplayName(currentPackage);

                        // 记录新应用的开始时间和包名
                        lastAppStartTime.value = Date.now();
                        lastAppName.value = displayName;
                        lastAppPackage.value = currentPackage;

                        // --- 规则判定 ---
                        if (whitelist.includes(currentPackage)) {
                            // ✅ 白名单 (学习软件)
                            lastAppType.value = 'good';
                            handleGoodApp(displayName, currentPackage, 0);

                        } else if (blacklist.includes(currentPackage)) {
                            // ❌ 黑名单 (娱乐软件)
                            lastAppType.value = 'bad';
                            handleBadApp(displayName, currentPackage, 0);

                        } else {
                            // ⚠️ 未知应用 (中立)
                            lastAppType.value = 'unknown';
                            handleUnknownApp(displayName, currentPackage);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Monitor tick error:", e);
        }
    };

    /**
     * 加载应用使用统计
     */
    const loadAppStats = () => {
        try {
            appStats.value = uni.getStorageSync('pet_app_stats') || {};
        } catch (e) {
            appStats.value = {};
        }
    };

    /**
     * 保存应用使用统计
     */
    const saveAppStats = () => {
        try {
            uni.setStorageSync('pet_app_stats', appStats.value);
        } catch (e) {
            console.error('保存应用统计失败:', e);
        }
    };

    /**
     * 更新应用统计
     */
    const updateAppStats = (packageName, displayName, type, minutes) => {
        if (!appStats.value[packageName]) {
            appStats.value[packageName] = {
                name: displayName,
                count: 0,
                totalMinutes: 0,
                type: type
            };
        }
        appStats.value[packageName].count += 1;
        appStats.value[packageName].totalMinutes += minutes;
        appStats.value[packageName].name = displayName; // 更新名称
        saveAppStats();
    };

    /**
     * 获取应用排行榜（前N名）
     */
    const getAppRanking = (limit = 5) => {
        const stats = Object.entries(appStats.value);
        return stats
            .map(([pkg, data]) => ({ package: pkg, ...data }))
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
            .slice(0, limit);
    };

    /**
     * 结算上一个应用的使用时长
     */
    const settleLastAppUsage = () => {
        if (!lastAppStartTime.value || !lastAppType.value) return;

        const now = Date.now();
        const durationMs = now - lastAppStartTime.value;
        const durationMinutes = Math.floor(durationMs / 60000);

        if (durationMinutes < 1) return;

        if (addLog) addLog(`应用使用时长: ${lastAppName.value} ${durationMinutes}分钟`);

        // 更新应用统计
        if (lastAppPackage.value) {
            updateAppStats(lastAppPackage.value, lastAppName.value, lastAppType.value, durationMinutes);
        }

        if (lastAppType.value === 'good' && useGrowthIntegration) {
            useGrowthIntegration.rewardStudy(durationMinutes);
            if (useGrowthLogIntegration) {
                useGrowthLogIntegration.addGrowthLog(`学习 ${durationMinutes}分钟 (${lastAppName.value})`, durationMinutes);
            }

            // 分时段学习奖励提示
            triggerLearningMilestone(durationMinutes, lastAppName.value);

        } else if (lastAppType.value === 'bad' && useGrowthIntegration) {
            useGrowthIntegration.penaltyIdle(durationMinutes);
            if (useGrowthLogIntegration) {
                useGrowthLogIntegration.addGrowthLog(`摸鱼 ${durationMinutes}分钟 (${lastAppName.value})`, -durationMinutes);
            }

            // 摸鱼警告
            triggerSlackingWarning(durationMinutes, lastAppName.value);
        }

        // 重置
        lastAppStartTime.value = null;
        lastAppType.value = null;
        lastAppPackage.value = "";
    };

    /**
     * 触发学习里程碑奖励提示
     */
    const triggerLearningMilestone = (minutes, appName) => {
        let message = '';

        if (minutes >= 60) {
            message = `🏆 太厉害了！学习了整整${minutes}分钟！你是真正的学霸！`;
        } else if (minutes >= 30) {
            message = `🎉 坚持学习${minutes}分钟！继续保持这个势头！`;
        } else if (minutes >= 15) {
            message = `👏 不错不错，${minutes}分钟！再接再厉~`;
        } else if (minutes >= 5) {
            message = `✨ ${minutes}分钟学习完成！好的开始~`;
        }

        if (message) {
            // 发送到悬浮窗
            if (sendToFloat) {
                sendToFloat(1, message.replace(/！/g, '！<br>'));
            }
            // 发送到聊天面板
            if (useChatIntegration && useChatIntegration.addMessage) {
                useChatIntegration.addMessage('pet', message, { type: 'reward', emotion: 'happy' });
            }
        }
    };

    /**
     * 触发摸鱼警告
     */
    const triggerSlackingWarning = (minutes, appName) => {
        let message = '';

        if (minutes >= 60) {
            message = `😱 玩了${minutes}分钟？！你的良心不会痛吗？！`;
        } else if (minutes >= 30) {
            message = `😤 ${minutes}分钟摸鱼！我真的会谢...`;
        } else if (minutes >= 15) {
            message = `😠 ${minutes}分钟浪费了！该收收心了！`;
        } else if (minutes >= 5) {
            message = `🙄 摸了${minutes}分钟鱼...差不多得了`;
        }

        if (message) {
            // 发送到悬浮窗
            if (sendToFloat) {
                sendToFloat(2, message.replace(/？！/g, '？！<br>').replace(/！/g, '！<br>'));
            }
            // 发送到聊天面板
            if (useChatIntegration && useChatIntegration.addMessage) {
                useChatIntegration.addMessage('pet', message, { type: 'warning', emotion: 'angry' });
            }
        }
    };

    /**
     * 处理白名单应用(学习软件)
     */
    const handleGoodApp = (appName, packageName, duration = 0) => {
        if (addLog) addLog(`>>> 正在学习: ${appName}`);

        // 如果集成了AI系统,触发评论（只在首次切换时触发）
        if (duration === 0 && useAIIntegration && sendToFloat) {
            // 构建上下文数据
            const context = useGrowthIntegration ? {
                level: useGrowthIntegration.petLevel?.value || 1,
                mood: useGrowthIntegration.mood?.value || 50,
                todayStudyTime: useGrowthIntegration.todayStudyTime?.value || 0,
                todayIdleTime: useGrowthIntegration.todayIdleTime?.value || 0
            } : {};
            useAIIntegration.triggerPetComment(appName, 'good', sendToFloat, addLog, context);
        }

        // 兼容旧回调方式
        if (onGoodApp) onGoodApp(appName, packageName);
    };

    /**
     * 处理黑名单应用(娱乐软件)
     */
    const handleBadApp = (appName, packageName, duration = 0) => {
        if (addLog) addLog(`>>> 警告: 正在摸鱼 ${appName}`);

        // 如果集成了AI系统,触发毒舌评论（只在首次切换时触发）
        if (duration === 0 && useAIIntegration && sendToFloat) {
            // 构建上下文数据
            const context = useGrowthIntegration ? {
                level: useGrowthIntegration.petLevel?.value || 1,
                mood: useGrowthIntegration.mood?.value || 50,
                todayStudyTime: useGrowthIntegration.todayStudyTime?.value || 0,
                todayIdleTime: useGrowthIntegration.todayIdleTime?.value || 0
            } : {};
            useAIIntegration.triggerPetComment(appName, 'bad', sendToFloat, addLog, context);
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
        // 先结算当前应用的使用时长
        settleLastAppUsage();

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

    // 初始化时加载统计数据
    loadAppStats();

    return {
        // 状态
        isMonitoring,
        monitorIntervalTime,
        lastPackage,
        appStats,  // 新增：应用统计数据

        // 方法
        toggleMonitor,
        startMonitor,
        stopMonitor,
        checkCurrentApp,
        updateMonitorInterval,
        getAppRanking,  // 新增：获取排行榜
        loadAppStats    // 新增：重新加载统计
    };
}
