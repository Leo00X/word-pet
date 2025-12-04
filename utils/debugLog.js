/**
 * 调试日志工具
 * 在 HBuilderX 控制台输出手机操作日志
 */

const DEBUG_ENABLED = true; // 设置为 false 可关闭调试输出

/**
 * 输出调试日志
 * @param {string} tag - 标签（如：Chat, Monitor, UI）
 * @param {string} message - 消息内容
 * @param {any} data - 附加数据
 */
export function debugLog(tag, message, data = null) {
    if (!DEBUG_ENABLED) return;

    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const prefix = `[${time}] [${tag}]`;

    if (data !== null) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

/**
 * 输出用户操作日志
 * @param {string} action - 操作名称
 * @param {Object} details - 操作详情
 */
export function logUserAction(action, details = {}) {
    debugLog('用户操作', `${action}`, details);
}

/**
 * 输出 AI 相关日志
 * @param {string} message - 消息
 * @param {any} data - 数据
 */
export function logAI(message, data = null) {
    debugLog('AI', message, data);
}

/**
 * 输出监控相关日志
 * @param {string} message - 消息
 * @param {any} data - 数据
 */
export function logMonitor(message, data = null) {
    debugLog('监控', message, data);
}

/**
 * 输出错误日志
 * @param {string} location - 错误位置
 * @param {Error} error - 错误对象
 */
export function logError(location, error) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    console.error(`[${time}] [错误@${location}]`, error);
}

/**
 * 输出成功日志（带绿色标记）
 * @param {string} message - 消息
 */
export function logSuccess(message) {
    debugLog('✅', message);
}

/**
 * 输出警告日志
 * @param {string} message - 消息
 */
export function logWarning(message) {
    debugLog('⚠️', message);
}
