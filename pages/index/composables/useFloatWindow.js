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

// 悬浮窗尺寸配置 - 根据版本使用不同尺寸
const FLOAT_SIZES_V1 = {
    SMALL: { w: 60, h: 60 },    // 迷你球
    NORMAL: { w: 160, h: 180 }, // v1 默认
    BUBBLE: { w: 160, h: 180 }, // v1 气泡
    LARGE: { w: 200, h: 220 },  // v1 大对话
    FULL: { w: 300, h: 300 }    // 警告模式
};

const FLOAT_SIZES_V2 = {
    SMALL: { w: 60, h: 60 },    // 迷你球
    NORMAL: { w: 160, h: 240 }, // v2 默认（更大以容纳顶部气泡）
    BUBBLE: { w: 160, h: 240 }, // v2 气泡
    LARGE: { w: 200, h: 280 },  // v2 大对话
    FULL: { w: 300, h: 300 }    // 警告模式
};

// Live2D 版本尺寸配置 (需要更大的画布以渲染完整模型)
const FLOAT_SIZES_LIVE2D = {
    SMALL: { w: 80, h: 100 },   // 迷你版
    NORMAL: { w: 200, h: 300 }, // Live2D 默认（更大以显示完整模型）
    BUBBLE: { w: 200, h: 300 }, // 气泡模式
    LARGE: { w: 280, h: 400 },  // 大对话模式
    FULL: { w: 350, h: 450 }    // 全屏模式
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
    const petHtmlVersion = ref(uni.getStorageSync('pet_html_version') || 'v1'); // 'v1' | 'v2' | 'live2d'

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
            // 根据版本选择 HTML 文件
            let htmlFile = '/static/pet.html'; // v1 默认
            if (petHtmlVersion.value === 'v2') {
                htmlFile = '/static/pet-v2.html';
            } else if (petHtmlVersion.value === 'live2d') {
                htmlFile = '/static/pet-live2d.html';
            }
            const absolutePath = plus.io.convertLocalFileSystemURL(htmlFile);
            debugLog('[Float] 加载 HTML:', htmlFile);

            if (!floatWinInstance.value) {
                floatWinInstance.value = new FloatWindow();
            }

            floatWinInstance.value.loadUrl(absolutePath);
            setFloatSize('NORMAL');

            // 初始位置：屏幕右下角
            floatWinInstance.value.setGravity(2); // 1 = 下左

            floatWinInstance.value.setShowPattern(3); // 全局显示
            floatWinInstance.value.setDragEnable(true);
            // [BUG#103] 边缘吸附模式
            // 测试: 1=仅左侧锁定, 3=仅上方锁定, 12=四角(效果不明显)
            // 使用 0=无吸附，允许自由拖拽
            floatWinInstance.value.setSidePattern(12);

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

                // [BUG#105] 尺寸切换请求
                case 50:
                    if (data.action === 'resize' && data.size) {
                        debugLog("[Float] 动态调整尺寸:", data.size);
                        setFloatSize(data.size);
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
        debugLog("[Float] setFloatSize 被调用:", size);

        if (!floatWinInstance.value) {
            debugLog("[Float] setFloatSize 失败: 实例不存在");
            return;
        }

        // 根据版本选择尺寸配置
        let SIZES = FLOAT_SIZES_V1;
        if (petHtmlVersion.value === 'v2') {
            SIZES = FLOAT_SIZES_V2;
        } else if (petHtmlVersion.value === 'live2d') {
            SIZES = FLOAT_SIZES_LIVE2D;
        }
        const config = SIZES[size] || SIZES.NORMAL;
        const w = floatWinInstance.value.convertHtmlPxToAndroidPx(config.w);
        const h = floatWinInstance.value.convertHtmlPxToAndroidPx(config.h);

        debugLog("[Float] 尺寸变更:", { size, w, h, currentSize: currentSize.value });

        floatWinInstance.value.setFixedWidthHeight(true, w, h);
        currentSize.value = size;

        // 需要调用 updateWindow 才能生效
        if (isPetShown.value) {
            debugLog("[Float] 调用 updateWindow()");
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

    /**
     * [v2.0] 切换宠物 HTML 版本
     * @param {string} version - 'v1' | 'v2'
     */
    const setPetVersion = (version) => {
        if (version !== 'v1' && version !== 'v2' && version !== 'live2d') {
            debugLog('[Float] 无效版本:', version);
            return;
        }
        petHtmlVersion.value = version;
        uni.setStorageSync('pet_html_version', version);
        debugLog('[Float] 切换宠物版本:', version);

        // 如果悬浮窗正在显示，需要重新加载并更新尺寸
        if (isPetShown.value && floatWinInstance.value) {
            let htmlFile = '/static/pet.html';
            if (version === 'v2') {
                htmlFile = '/static/pet-v2.html';
            } else if (version === 'live2d') {
                htmlFile = '/static/pet-live2d.html';
            }
            const absolutePath = plus.io.convertLocalFileSystemURL(htmlFile);
            floatWinInstance.value.loadUrl(absolutePath);
            // 同步更新悬浮窗尺寸以匹配新版本
            setFloatSize(currentSize.value);
            debugLog('[Float] 重新加载:', htmlFile);
        }
    };

    return {
        // 状态
        isPetShown,
        petMessage,
        floatWinInstance,
        currentSize,
        petHtmlVersion,
        // 方法
        showFloatWindow,
        hideFloatWindow,
        togglePet,
        sendMessageToFloat,
        sendMultimodalResponse,
        setFloatSize,
        setSidePattern,
        reinitInstance,
        setPetVersion,
        // 常量
        FLOAT_SIZES_V1,
        FLOAT_SIZES_V2,
        FLOAT_SIZES_LIVE2D
    };
}

