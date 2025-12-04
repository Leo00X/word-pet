/**
 * 权限管理 Composable
 * 负责检查和请求 Android 权限（悬浮窗、使用统计）
 */
import { ref } from 'vue';

export function usePermissions() {
    // 权限状态
    const hasFloatPermission = ref(false);
    const hasUsagePermission = ref(false);

    /**
     * 检查所有权限状态
     */
    const checkPermissions = () => {
        if (uni.getSystemInfoSync().platform !== 'android') return;

        try {
            const Settings = plus.android.importClass("android.provider.Settings");
            const context = plus.android.runtimeMainActivity();

            // 检查悬浮窗权限
            hasFloatPermission.value = Settings.canDrawOverlays(context);

            // 检查使用统计权限
            const AppOpsManager = plus.android.importClass("android.app.AppOpsManager");
            const Process = plus.android.importClass("android.os.Process");
            const appOps = context.getSystemService(context.APP_OPS_SERVICE);
            const mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName()
            );
            hasUsagePermission.value = (mode === AppOpsManager.MODE_ALLOWED);
        } catch (e) {
            console.error('权限检查失败:', e);
        }
    };

    /**
     * 请求权限
     * @param {string} type - 权限类型 'float' | 'usage'
     */
    const requestPermission = (type) => {
        const main = plus.android.runtimeMainActivity();
        const Intent = plus.android.importClass("android.content.Intent");
        const Settings = plus.android.importClass("android.provider.Settings");
        const Uri = plus.android.importClass("android.net.Uri");

        if (type === 'float') {
            const intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
            intent.setData(Uri.parse("package:" + main.getPackageName()));
            main.startActivity(intent);
        } else if (type === 'usage') {
            const intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            main.startActivity(intent);
        }
    };

    return {
        hasFloatPermission,
        hasUsagePermission,
        checkPermissions,
        requestPermission
    };
}
