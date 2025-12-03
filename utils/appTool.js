// utils/appTool.js

// 辅助函数：休眠（让出主线程）
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function getInstalledApps(onProgress) {
    return new Promise(async (resolve, reject) => {
        if (uni.getSystemInfoSync().platform !== 'android') {
            resolve([]);
            return;
        }

        try {
            var main = plus.android.runtimeMainActivity();
            var pm = plus.android.invoke(main, "getPackageManager");
            var ApplicationInfo = plus.android.importClass("android.content.pm.ApplicationInfo");
            
            // 获取列表 (耗时操作1)
            var packages = plus.android.invoke(pm, "getInstalledPackages", 0);
            var size = plus.android.invoke(packages, "size");
            
            var appList = [];
            
            // ⚡️ 核心优化：分片处理，防止卡死
            // 每次处理 20 个应用，然后休息 30ms 让 UI 渲染
            const BATCH_SIZE = 20; 
            
            for (var i = 0; i < size; i++) {
                // 每处理 BATCH_SIZE 个，就暂停一下
                if (i % BATCH_SIZE === 0) {
                    await sleep(30); 
                    // 如果有进度回调，通知外部更新进度条
                    if (onProgress) {
                        onProgress(Math.floor((i / size) * 100));
                    }
                }

                var packageInfo = plus.android.invoke(packages, "get", i);
                var appInfo = plus.android.getAttribute(packageInfo, "applicationInfo");
                var pkgName = plus.android.getAttribute(packageInfo, "packageName");
                
                if (!pkgName) continue;

                var appName = pkgName; // 默认用包名
                try {
                    // 获取名字最耗时，放 try 里
                    var label = plus.android.invoke(appInfo, "loadLabel", pm);
                    appName = label.toString();
                } catch(e) {}
                
                var flags = plus.android.getAttribute(appInfo, "flags");
                var isSys = (flags & ApplicationInfo.FLAG_SYSTEM) !== 0;

                appList.push({
                    name: appName || "未知应用",
                    package: pkgName,
                    isSystem: isSys
                });
            }
            
            resolve(appList);

        } catch (e) {
            console.error("扫描崩溃: " + e.message);
            resolve([]); 
        }
    });
}