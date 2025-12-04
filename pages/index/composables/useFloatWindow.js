/**
 * 悬浮窗控制 Composable
 * 负责悬浮窗的创建、显示、隐藏和双向通信
 */
import { ref } from 'vue';
import { FloatWindow } from "@/uni_modules/android-floatwindow";

export function useFloatWindow(options = {}) {
    const {
        onPermissionDenied,  // 权限不足回调
        onPetInteraction,    // 宠物互动回调
        addLog               // 添加日志回调
    } = options;

    // 状态
    const isPetShown = ref(false);
    const petMessage = ref("等待指令...");
    const floatWinInstance = ref(null);

    /**
     * 显示悬浮窗
     * @param {boolean} hasPermission - 是否有悬浮窗权限
     */
    const showFloatWindow = (hasPermission) => {
        if (!hasPermission) {
            if (addLog) addLog("错误: 缺少悬浮窗权限");
            if (onPermissionDenied) onPermissionDenied('float');
            return;
        }

        try {
            const rawPath = '/static/pet.html';
            const absolutePath = plus.io.convertLocalFileSystemURL(rawPath);

            if (!floatWinInstance.value) {
                floatWinInstance.value = new FloatWindow();
            }

            floatWinInstance.value.loadUrl(absolutePath);
            const w = floatWinInstance.value.convertHtmlPxToAndroidPx(200);
            const h = floatWinInstance.value.convertHtmlPxToAndroidPx(200);
            floatWinInstance.value.setFixedWidthHeight(true, w, h);

            const x = floatWinInstance.value.convertHtmlPxToAndroidPx(200);
            const y = floatWinInstance.value.convertHtmlPxToAndroidPx(300);
            floatWinInstance.value.setLocation(x, y);

            floatWinInstance.value.setShowPattern(3);
            floatWinInstance.value.setDragEnable(true);

            // 监听 Web 消息 (双向通信)
            floatWinInstance.value.onListenerWebData((type, msg) => {
                console.log("Web消息:", type, msg);

                if (msg === 'pet_clicked') {
                    petMessage.value = "别戳我！去背单词！";

                    // 回调处理互动（由外部处理心情值和日志）
                    if (onPetInteraction) {
                        onPetInteraction();
                    }

                    // 互动反馈 (无需调用 AI，直接本地回复)
                    setTimeout(() => {
                        sendMessageToFloat(1, "别戳我！<br>去背单词！");
                    }, 100);
                }
            });

            floatWinInstance.value.createAndShow();
            isPetShown.value = true;
            petMessage.value = "正在扫描环境...";
            if (addLog) addLog("系统: 寄生兽召唤成功");

        } catch (e) {
            console.error(e);
            if (addLog) addLog("错误: " + e.message);
            floatWinInstance.value = null;
        }
    };

    /**
     * 隐藏悬浮窗
     */
    const hideFloatWindow = () => {
        if (floatWinInstance.value) {
            try {
                floatWinInstance.value.dismiss();
            } catch (e) {
                console.error('关闭悬浮窗失败:', e);
            }
        }
        isPetShown.value = false;
        petMessage.value = "zzz...";
        if (addLog) addLog("系统: 寄生兽已收回");
    };

    /**
     * 切换悬浮窗显示状态
     * @param {boolean} hasPermission - 是否有权限
     */
    const togglePet = (hasPermission) => {
        if (isPetShown.value) {
            hideFloatWindow();
        } else {
            showFloatWindow(hasPermission);
        }
    };

    /**
     * 发送消息到悬浮窗
     * @param {number} type - 消息类型 (1=绿色, 2=红色, 3=清除)
     * @param {string} msg - 消息内容
     */
    const sendMessageToFloat = (type, msg) => {
        if (floatWinInstance.value) {
            floatWinInstance.value.sendDataToJs(type, msg);
        }
    };

    /**
     * 重新初始化实例（页面恢复时使用）
     */
    const reinitInstance = () => {
        if (!floatWinInstance.value && isPetShown.value) {
            floatWinInstance.value = new FloatWindow();
        }
        petMessage.value = isPetShown.value ? "我在看着你..." : "zzz...";
    };

    return {
        // 状态
        isPetShown,
        petMessage,
        floatWinInstance,

        // 方法
        showFloatWindow,
        hideFloatWindow,
        togglePet,
        sendMessageToFloat,
        reinitInstance
    };
}
