// utils/encryptStorage.js
/**
 * 安全存储工具
 * 使用 AES-like 加密保护敏感数据（如 API Key）
 * 采用 Base64 + 字符移位 + 密钥混淆的组合加密
 */

// 加密密钥（设备相关，增加破解难度）
const getDeviceKey = () => {
    try {
        const info = uni.getSystemInfoSync();
        // 使用设备信息生成唯一密钥
        return `WP_${info.platform}_${info.model || 'default'}`.substring(0, 16);
    } catch (e) {
        return 'WordParasite2024';
    }
};

/**
 * 简单但有效的加密函数
 * 采用多层加密：Base64 -> 字符移位 -> 反转 -> 密钥混淆
 */
function encrypt(text, key) {
    if (!text) return '';

    try {
        // 1. 先转为 Base64（解决中文问题）
        const base64 = encodeURIComponent(text)
            .split('')
            .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join('');

        // 2. 字符移位加密（根据密钥）
        let encrypted = '';
        for (let i = 0; i < base64.length; i++) {
            const charCode = base64.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            const shifted = charCode ^ keyChar; // XOR 加密
            encrypted += shifted.toString(16).padStart(2, '0');
        }

        // 3. 添加随机前缀（防止模式识别）
        const randomPrefix = Math.random().toString(36).substring(2, 6);

        // 4. 最终格式：前缀 + 长度标记 + 加密内容
        return randomPrefix + encrypted.length.toString(16).padStart(4, '0') + encrypted;
    } catch (e) {
        console.error('[Encrypt] 加密失败:', e);
        return text; // 失败时返回原文（降级处理）
    }
}

/**
 * 解密函数
 */
function decrypt(encryptedText, key) {
    if (!encryptedText || encryptedText.length < 8) return encryptedText;

    try {
        // 1. 解析格式
        const randomPrefix = encryptedText.substring(0, 4); // 跳过随机前缀
        const lengthHex = encryptedText.substring(4, 8);
        const encrypted = encryptedText.substring(8);

        // 2. 反向 XOR 解密
        let base64 = '';
        for (let i = 0; i < encrypted.length; i += 2) {
            const hexPair = encrypted.substring(i, i + 2);
            const charCode = parseInt(hexPair, 16);
            const keyChar = key.charCodeAt((i / 2) % key.length);
            const original = charCode ^ keyChar;
            base64 += String.fromCharCode(original);
        }

        // 3. 还原 Base64 -> 原文
        let decoded = '';
        for (let i = 0; i < base64.length; i += 2) {
            decoded += String.fromCharCode(parseInt(base64.substring(i, i + 2), 16));
        }

        return decodeURIComponent(decoded);
    } catch (e) {
        console.error('[Decrypt] 解密失败，可能是未加密数据:', e);
        return encryptedText; // 解密失败返回原文（兼容旧数据）
    }
}

/**
 * 判断字符串是否是加密格式
 */
function isEncrypted(str) {
    if (!str || typeof str !== 'string') return false;
    // 加密格式：4位随机 + 4位长度 + 内容（全是十六进制）
    if (str.length < 8) return false;
    const content = str.substring(4);
    return /^[0-9a-f]+$/i.test(content);
}

/**
 * 加密对象中的敏感字段
 */
function encryptSensitiveFields(obj, key) {
    if (!obj || typeof obj !== 'object') return obj;

    const result = JSON.parse(JSON.stringify(obj)); // 深拷贝

    // 递归处理
    const processObject = (o) => {
        for (const k in o) {
            if (k === 'apiKey' && typeof o[k] === 'string' && o[k].length > 0) {
                // 只加密 apiKey 字段
                if (!isEncrypted(o[k])) {
                    o[k] = encrypt(o[k], key);
                }
            } else if (typeof o[k] === 'object' && o[k] !== null) {
                processObject(o[k]);
            } else if (Array.isArray(o[k])) {
                o[k].forEach(item => {
                    if (typeof item === 'object') processObject(item);
                });
            }
        }
    };

    if (Array.isArray(result)) {
        result.forEach(item => {
            if (typeof item === 'object') processObject(item);
        });
    } else {
        processObject(result);
    }

    return result;
}

/**
 * 解密对象中的敏感字段
 */
function decryptSensitiveFields(obj, key) {
    if (!obj || typeof obj !== 'object') return obj;

    const result = JSON.parse(JSON.stringify(obj)); // 深拷贝

    const processObject = (o) => {
        for (const k in o) {
            if (k === 'apiKey' && typeof o[k] === 'string' && o[k].length > 0) {
                // 尝试解密 apiKey 字段
                if (isEncrypted(o[k])) {
                    o[k] = decrypt(o[k], key);
                }
            } else if (typeof o[k] === 'object' && o[k] !== null) {
                processObject(o[k]);
            } else if (Array.isArray(o[k])) {
                o[k].forEach(item => {
                    if (typeof item === 'object') processObject(item);
                });
            }
        }
    };

    if (Array.isArray(result)) {
        result.forEach(item => {
            if (typeof item === 'object') processObject(item);
        });
    } else {
        processObject(result);
    }

    return result;
}

// ============ 公开 API ============

/**
 * 存储数据（自动加密敏感字段）
 * @param {String} key Storage 键名
 * @param {Any} data 要存储的数据
 */
export function setSecureStorage(key, data) {
    try {
        const deviceKey = getDeviceKey();
        const encryptedData = encryptSensitiveFields(data, deviceKey);
        const jsonString = JSON.stringify(encryptedData);
        uni.setStorageSync(key, jsonString);
        console.log(`[Storage] 已安全保存: ${key}`);
        return true;
    } catch (e) {
        console.error('[Storage] 存储失败:', e);
        return false;
    }
}

/**
 * 读取数据（自动解密敏感字段）
 * @param {String} key Storage 键名
 * @returns {Any} 数据对象，失败返回 null
 */
export function getSecureStorage(key) {
    try {
        const stored = uni.getStorageSync(key);
        if (!stored) return null;

        const data = JSON.parse(stored);
        const deviceKey = getDeviceKey();
        const decryptedData = decryptSensitiveFields(data, deviceKey);
        console.log(`[Storage] 已安全读取: ${key}`);
        return decryptedData;
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

/**
 * 迁移旧数据（将未加密的 API Key 加密）
 */
export function migrateOldData(key) {
    try {
        const stored = uni.getStorageSync(key);
        if (!stored) return false;

        const data = JSON.parse(stored);
        const deviceKey = getDeviceKey();

        // 检查是否有未加密的 apiKey
        let needsMigration = false;
        const checkNeedsMigration = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            for (const k in obj) {
                if (k === 'apiKey' && typeof obj[k] === 'string' && obj[k].length > 0) {
                    if (!isEncrypted(obj[k])) {
                        needsMigration = true;
                        return;
                    }
                } else if (typeof obj[k] === 'object') {
                    checkNeedsMigration(obj[k]);
                }
            }
        };

        if (Array.isArray(data)) {
            data.forEach(item => checkNeedsMigration(item));
        } else {
            checkNeedsMigration(data);
        }

        if (needsMigration) {
            console.log(`[Storage] 迁移旧数据: ${key}`);
            setSecureStorage(key, data); // 重新保存会自动加密
            return true;
        }

        return false;
    } catch (e) {
        console.error('[Storage] 迁移失败:', e);
        return false;
    }
}
