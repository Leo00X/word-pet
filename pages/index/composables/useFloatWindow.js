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
import { useLive2dLoader } from './useLive2dLoader.js';

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

// Live2D 版本尺寸配置 (增大高度预留气泡空间)
const FLOAT_SIZES_LIVE2D = {
    SMALL: { w: 70, h: 120 },   // 迷你版
    NORMAL: { w: 130, h: 300 }, // Live2D 默认: 220(模型) + 80(气泡)
    BUBBLE: { w: 150, h: 320 }, // 气泡模式
    LARGE: { w: 180, h: 350 },  // 大对话模式
    FULL: { w: 240, h: 450 }    // 全屏模式
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
    const bubbleWinInstance = ref(null);  // 独立气泡悬浮窗
    const currentSize = ref('NORMAL');
    const petHtmlVersion = ref(uni.getStorageSync('pet_html_version') || 'v1'); // 'v1' | 'v2' | 'live2d'
    let bubbleHideTimer = null;  // 气泡自动隐藏定时器

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
            // ========== 开发调试模式配置 ==========
            // 启用后可通过本地 HTTP 服务器加载 HTML，实现热更新
            // 使用方法:
            // 1. 在电脑上启动 HTTP 服务器: cd word-pet && npx http-server -p 8080
            // 2. 将 DEV_MODE 设为 true，DEV_SERVER_IP 设为电脑局域网 IP
            // 3. 手机和电脑连接同一 WiFi
            // 4. 修改 HTML 后悬浮窗关闭再打开即可看到更新
            const DEV_MODE = true;  // 🔧 调试时改为 true
            const DEV_SERVER_IP = '172.19.216.67';  // 🔧 改为你的电脑 IP
            const DEV_SERVER_PORT = '8080';
            // ==========================================

            // 根据版本选择 HTML 文件
            let htmlFile = '/static/pet.html'; // v1 默认
            let absolutePath;

            if (petHtmlVersion.value === 'v2') {
                htmlFile = '/static/pet-v2.html';
            } else if (petHtmlVersion.value === 'live2d') {
                htmlFile = '/static/pet-live2d.html';
            }

            // 根据模式选择加载方式
            if (DEV_MODE) {
                // 开发模式: 通过 HTTP 加载（实时更新）
                absolutePath = `http://${DEV_SERVER_IP}:${DEV_SERVER_PORT}${htmlFile}`;
                debugLog('[Float] 🔧 开发模式 - 加载远程 HTML:', absolutePath);
            } else {
                // 生产模式: 加载打包的本地文件
                absolutePath = plus.io.convertLocalFileSystemURL(htmlFile);
                debugLog('[Float] 加载本地 HTML:', absolutePath);
            }

            if (!floatWinInstance.value) {
                floatWinInstance.value = new FloatWindow();
            }

            floatWinInstance.value.loadUrl(absolutePath);

            // Live2D 模式: 页面加载后发送模型数据
            if (petHtmlVersion.value === 'live2d') {
                const live2dLoader = useLive2dLoader();
                // 延迟等待页面加载完成
                setTimeout(async () => {
                    debugLog('[Float] 开始加载 Live2D 模型数据...');
                    const currentModel = uni.getStorageSync('live2d_model') || 'hiyori';
                    await live2dLoader.sendModelToFloatWindow(floatWinInstance.value, currentModel);
                }, 1500); // 1.5秒后发送模型数据
            }
            setFloatSize('NORMAL');

            // [BUG #112] 移除 setGravity 调用，避免位置被重置
            // 悬浮窗位置完全由用户拖拽控制，不设置初始对齐位置

            floatWinInstance.value.setShowPattern(3); // 全局显示
            floatWinInstance.value.setDragEnable(true);
            // [BUG#103] 边缘吸附模式
            // 使用 0=无吸附，允许自由拖拽
            floatWinInstance.value.setSidePattern(0);

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
     * @param {number} type - 消息类型 (1=普通消息, 2=愤怒消息, 其他类型正常发送)
     * @param {string} msg - 消息内容
     */
    const sendMessageToFloat = (type, msg) => {
        // Live2D 模式：气泡消息(type 1/2)路由到独立悬浮窗
        if (petHtmlVersion.value === 'live2d' && (type === 1 || type === 2)) {
            showBubble(type, typeof msg === 'string' ? msg : JSON.stringify(msg));
            return;
        }

        // 其他模式或其他消息类型，正常发送到模型悬浮窗
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

        // [BUG #112] 移除 updateWindow 调用，避免位置被重置
        // setFixedWidthHeight 本身在创建时就会生效
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

    /**
     * [Live2D] 显示独立气泡悬浮窗
     * @param {number} msgType - 消息类型 (1=普通, 2=愤怒)
     * @param {string} text - 气泡内容
     * @param {number} duration - 显示时长(毫秒)，默认 4000
     */
    const showBubble = (msgType, text, duration = 4000) => {
        // 仅 Live2D 模式使用独立气泡
        if (petHtmlVersion.value !== 'live2d') {
            // 非 Live2D 模式直接发送到模型悬浮窗
            sendMessageToFloat(msgType, text);
            return;
        }

        // #ifdef APP-PLUS
        debugLog('[Bubble] 显示气泡:', text.substring(0, 20) + '...');

        // 清除之前的定时器
        if (bubbleHideTimer) {
            clearTimeout(bubbleHideTimer);
            bubbleHideTimer = null;
        }

        if (!floatWinInstance.value) return;

        // [BUG #112] 不再调用 updateWindow，避免位置重置
        // 直接发送气泡消息，在固定尺寸内显示
        floatWinInstance.value.sendDataToJs(msgType, text);

        // 自动隐藏
        bubbleHideTimer = setTimeout(() => {
            hideBubble();
        }, duration);
        // #endif
    };

    /**
     * [Live2D] 隐藏气泡（恢复悬浮窗大小）
     */
    const hideBubble = () => {
        // #ifdef APP-PLUS
        if (!floatWinInstance.value) return;

        debugLog('[Bubble] 隐藏气泡');

        // [BUG #112] 不再调用 updateWindow，避免位置重置
        floatWinInstance.value.sendDataToJs(0, '');

        if (bubbleHideTimer) {
            clearTimeout(bubbleHideTimer);
            bubbleHideTimer = null;
        }
        // #endif
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
        showBubble,      // [新] 独立气泡
        hideBubble,      // [新] 隐藏气泡
        // 常量
        FLOAT_SIZES_V1,
        FLOAT_SIZES_V2,
        FLOAT_SIZES_LIVE2D
    };
}

