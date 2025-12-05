// utils/encryptStorage.js
/**
 * 简化存储工具
 * 临时禁用加密，直接存储 JSON（解决中文字符编码问题）
 */

/**
 * 存储数据
 * @param {String} key Storage 键名
 * @param {Any} data 要存储的数据（会自动 JSON 序列化）
 */
export function setSecureStorage(key, data) {
    try {
        const jsonString = JSON.stringify(data);
        uni.setStorageSync(key, jsonString);
        console.log(`[Storage] 已保存: ${key}`);
        return true;
    } catch (e) {
        console.error('[Storage] 存储失败:', e);
        return false;
    }
}

/**
 * 读取数据
 * @param {String} key Storage 键名
 * @returns {Any} 数据对象，失败返回 null
 */
export function getSecureStorage(key) {
    try {
        const stored = uni.getStorageSync(key);
        if (!stored) return null;

        // 直接解析 JSON
        const data = JSON.parse(stored);
        console.log(`[Storage] 已读取: ${key}`);
        return data;
    } catch (e) {
        console.error('[Storage] 读取失败，清除损坏数据:', e);
        uni.removeStorageSync(key);
        return null;
    }
}

/**
 * 删除数据
 * @param {String} key Storage 键名
 */
export function removeSecureStorage(key) {
    uni.removeStorageSync(key);
    console.log(`[Storage] 已删除: ${key}`);
}
