/**
 * 悬浮窗控制 Composable
 * 负责悬浮窗的创建、显示、隐藏和双向通信
 * 
 * 消息类型协议:
 * - 0: 隐藏气泡
 * - 1: 普通消息 (绿色)
 * - 2: 警告消息 (红色)
 * - 3: 恢复正常状态
 * - 98: 动画状态切换
 * - 99: 皮肤切换
 * - 100: 手势事件 (H5 → uni-app)
 * - 200: 多模态响应 (uni-app → H5)
 */
import { ref } from 'vue';
import { FloatWindow } from "@/uni_modules/android-floatwindow";
import { debugLog } from '@/utils/debugLog.js';

// 悬浮窗尺寸配置
const FLOAT_SIZES = {
    SMALL: { w: 80, h: 80 },    // 待机球
    NORMAL: { w: 200, h: 200 }, // 默认
    LARGE: { w: 300, h: 250 },  // 互动展开
    FULL: { w: 400, h: 400 }    // 警告模式
};

export function useFloatWindow(options = {}) {
    const {
        onPermissionDenied,  // 权限不足回调
        onPetInteraction,    // 宠物互动回调 (兼容旧版)
        onGestureEvent,      // [新] 手势事件回调
        onDragEvent,         // [新] 拖拽事件回调
        addLog               // 添加日志回调
    } = options;

    // 状态
    const isPetShown = ref(false);
    const petMessage = ref("等待指令...");
    const floatWinInstance = ref(null);
    const currentSize = ref('NORMAL');

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
            setFloatSize('NORMAL');

            // 初始位置：屏幕右下角
            floatWinInstance.value.setGravity(8); // 8 = 下右

            floatWinInstance.value.setShowPattern(3); // 全局显示
            floatWinInstance.value.setDragEnable(true);
            floatWinInstance.value.setSidePattern(12); // 四角吸附

            // 监听 Web 消息 (增强版双向通信)
            floatWinInstance.value.onListenerWebData(handleWebMessage);

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
     * 处理来自 H5 的消息
     */
    const handleWebMessage = (type, msg) => {
        debugLog("[Float] Web消息:", type, msg);

        try {
            let data = msg;
            if (typeof msg === 'string' && msg.startsWith('{')) {
                data = JSON.parse(msg);
            }

            switch (type) {
                // 手势事件 (单击/双击/长按)
                case 1:
                case 3:
                case 4:
                    if (onGestureEvent) {
                        onGestureEvent(data);
                    }
                    // 兼容旧版回调
                    if (data.event === 'pet_clicked' && onPetInteraction) {
                        onPetInteraction();
                    }
                    break;

                // 拖拽事件
                case 10:
                case 11:
                    if (onDragEvent) {
                        onDragEvent(data);
                    }
                    break;

                // 新版手势事件 (统一格式)
                case 100:
                    if (onGestureEvent) {
                        onGestureEvent(data);
                    }
                    break;

                default:
                    debugLog("[Float] 未处理消息类型:", type);
            }
        } catch (e) {
            debugLog("[Float] 消息解析错误:", e);
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
     * @param {number} type - 消息类型
     * @param {string} msg - 消息内容
     */
    const sendMessageToFloat = (type, msg) => {
        if (floatWinInstance.value) {
            floatWinInstance.value.sendDataToJs(type, msg);
        }
    };

    /**
     * [新] 发送多模态响应到悬浮窗
     * @param {Object} response - { text, action, bubbleColor, duration }
     */
    const sendMultimodalResponse = (response) => {
        sendMessageToFloat(200, JSON.stringify(response));
    };

    /**
     * [新] 设置悬浮窗尺寸
     * @param {string} size - 'SMALL' | 'NORMAL' | 'LARGE' | 'FULL'
     */
    const setFloatSize = (size) => {
        if (!floatWinInstance.value) return;

        const config = FLOAT_SIZES[size] || FLOAT_SIZES.NORMAL;
        const w = floatWinInstance.value.convertHtmlPxToAndroidPx(config.w);
        const h = floatWinInstance.value.convertHtmlPxToAndroidPx(config.h);
        floatWinInstance.value.setFixedWidthHeight(true, w, h);
        currentSize.value = size;

        // 需要调用 updateWindow 才能生效
        if (isPetShown.value) {
            floatWinInstance.value.updateWindow();
        }
    };

    /**
     * [新] 切换吸附模式
     * @param {number} pattern - 0~14 的吸附模式
     */
    const setSidePattern = (pattern) => {
        if (floatWinInstance.value) {
            floatWinInstance.value.setSidePattern(pattern);
        }
    };

    /**
     * 重新初始化实例
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
        currentSize,
        // 方法
        showFloatWindow,
        hideFloatWindow,
        togglePet,
        sendMessageToFloat,
        sendMultimodalResponse,
        setFloatSize,
        setSidePattern,
        reinitInstance,
        // 常量
        FLOAT_SIZES
    };
}

