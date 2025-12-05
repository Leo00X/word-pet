/**
 * 问候系统 Composable
 * 管理每日问候和待发送消息队列
 */

/**
 * 根据时间段获取问候语
 * @returns {string} 问候消息
 */
export function getTimeBasedGreeting() {
    const hour = new Date().getHours();

    if (hour < 6) {
        return '夜深了还不睡？😴 熬夜对身体不好哦...';
    } else if (hour < 9) {
        return '早上好！☀️ 今天也要加油学习呀~';
    } else if (hour < 12) {
        return '上午好！📚 状态正佳，是学习的好时机！';
    } else if (hour < 14) {
        return '中午好！🍱 吃饱了再继续战斗吧~';
    } else if (hour < 18) {
        return '下午好！☕ 来杯咖啡提提神？';
    } else if (hour < 22) {
        return '晚上好！🌙 今天学习得怎么样？';
    } else {
        return '还在熬夜？😅 早点休息，明天继续！';
    }
}

/**
 * 检查是否需要发送每日问候
 * @returns {boolean} 是否是今天第一次
 */
export function shouldShowDailyGreeting() {
    const today = new Date().toDateString();
    const lastGreetingDate = uni.getStorageSync('last_greeting_date') || '';
    return lastGreetingDate !== today;
}

/**
 * 标记今日已问候
 */
export function markDailyGreetingShown() {
    uni.setStorageSync('last_greeting_date', new Date().toDateString());
}

/**
 * 保存待发送的问候（供悬浮窗启动时显示）
 * @param {string} greeting - 问候消息
 */
export function savePendingGreeting(greeting) {
    uni.setStorageSync('pending_greeting', greeting);
}

/**
 * 获取并清除待发送的问候
 * @returns {string|null} 待发送的问候或 null
 */
export function getAndClearPendingGreeting() {
    const pending = uni.getStorageSync('pending_greeting');
    if (pending) {
        uni.removeStorageSync('pending_greeting');
    }
    return pending || null;
}
