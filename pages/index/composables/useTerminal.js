/**
 * 终端日志管理 Composable
 * 负责终端弹窗的显示状态、日志内容管理和滚动控制
 */
import { ref } from 'vue';

export function useTerminal() {
    // 终端状态
    const showTerminal = ref(false);
    const logText = ref(">>> 系统初始化...\n");
    const scrollTop = ref(9999);

    /**
     * 添加日志
     * @param {string} msg - 日志消息
     */
    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        logText.value += `[${time}] ${msg}\n`;
        scrollTop.value += 50; // 自动滚动到底部
    };

    /**
     * 清空日志
     */
    const clearLog = () => {
        logText.value = '';
        scrollTop.value = 0;
    };

    /**
     * 打开终端
     */
    const openTerminal = () => {
        showTerminal.value = true;
    };

    /**
     * 关闭终端
     */
    const closeTerminal = () => {
        showTerminal.value = false;
    };

    return {
        // 状态
        showTerminal,
        logText,
        scrollTop,

        // 方法
        addLog,
        clearLog,
        openTerminal,
        closeTerminal
    };
}
