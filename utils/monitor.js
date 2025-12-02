// utils/monitor.js

export function getTopAppPackage() {
    if (uni.getSystemInfoSync().platform !== 'android') return null;

    try {
        // 引入类
        var Context = plus.android.importClass("android.content.Context");
        var UsageStatsManager = plus.android.importClass("android.app.usage.UsageStatsManager");
        var System = plus.android.importClass("java.lang.System");
        var Intent = plus.android.importClass("android.content.Intent");
        var Settings = plus.android.importClass("android.provider.Settings");
        
        var main = plus.android.runtimeMainActivity();
        var context = main.getApplicationContext();
        var usm = context.getSystemService(Context.USAGE_STATS_SERVICE);
        
        var now = System.currentTimeMillis();
        // 查过去60秒
        var stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 60 * 1000, now);
        
        // 【核心修复】更安全的判空逻辑
        if (stats == null) {
            return requestPerm(main, Settings);
        }

        // 【核心修复】使用 invoke 调用 Java 方法，避免 JS 识别错误
        var size = plus.android.invoke(stats, "size");
        if (size === 0) {
            return requestPerm(main, Settings);
        }

        // 遍历 List
        var iterator = plus.android.invoke(stats, "iterator");
        var lastPkg = null;
        var lastTime = 0;
        
        while (plus.android.invoke(iterator, "hasNext")) {
            var stat = plus.android.invoke(iterator, "next");
            // 获取最后使用时间
            var time = plus.android.invoke(stat, "getLastTimeUsed");
            
            if (time > lastTime) {
                lastTime = time;
                // 获取包名
                lastPkg = plus.android.invoke(stat, "getPackageName");
            }
        }
        
        return lastPkg;

    } catch (e) {
        console.log("监控报错: " + e.message);
        return null;
    }
}

// 辅助函数：弹窗申请权限
function requestPerm(main, Settings) {
    uni.showModal({
        title: '缺少权限',
        content: '请开启“查看使用情况”权限，否则无法监控学习时长。',
        showCancel: false,
        success: function (res) {
            if (res.confirm) {
                var intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                main.startActivity(intent);
            }
        }
    });
    return null;
}