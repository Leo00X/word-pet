/**
 * 应用包名到显示名称的映射工具
 */

/**
 * 根据应用包名获取显示名称
 * @param {string} pkg - 应用包名
 * @returns {string} 应用显示名称
 */
export function getAppName(pkg) {
    if (!pkg) return "未知";
    const parts = pkg.split('.');
    return parts[parts.length - 1];
}
