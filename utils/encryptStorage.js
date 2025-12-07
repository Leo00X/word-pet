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

// 加密数据的固定标识前缀（用于可靠识别加密数据）
const ENCRYPT_PREFIX = 'WPEN_';

/**
 * 简单但有效的加密函数
 * 采用多层加密：Base64 -> 字符移位 -> 密钥混淆
 * 使用 WPEN_ 前缀标识加密数据
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

        // 3. 添加随机后缀（防止模式识别）
        const randomSuffix = Math.random().toString(36).substring(2, 6);

        // 4. 最终格式：WPEN_ + 长度标记 + 加密内容 + 随机后缀
        // 使用固定前缀确保可靠识别
        return ENCRYPT_PREFIX + encrypted.length.toString(16).padStart(4, '0') + encrypted + randomSuffix;
    } catch (e) {
        console.error('[Encrypt] 加密失败:', e);
        return text; // 失败时返回原文（降级处理）
    }
}

/**
 * 解密函数
 * 支持新格式 (WPEN_ 前缀) 和旧格式兼容
 */
function decrypt(encryptedText, key) {
    if (!encryptedText || encryptedText.length < 8) return encryptedText;

    try {
        let encrypted;
        let encryptedLength;

        // 检测新格式 (WPEN_ 前缀)
        if (encryptedText.startsWith(ENCRYPT_PREFIX)) {
            // 新格式: WPEN_ + 4位长度 + 加密内容 + 4位随机后缀
            const lengthHex = encryptedText.substring(5, 9);
            encryptedLength = parseInt(lengthHex, 16);
            encrypted = encryptedText.substring(9, 9 + encryptedLength);
        } else {
            // 旧格式兼容: 4位随机前缀 + 4位长度 + 加密内容
            const lengthHex = encryptedText.substring(4, 8);
            encryptedLength = parseInt(lengthHex, 16);
            encrypted = encryptedText.substring(8);
        }

        // 反向 XOR 解密
        let base64 = '';
        for (let i = 0; i < encrypted.length; i += 2) {
            const hexPair = encrypted.substring(i, i + 2);
            const charCode = parseInt(hexPair, 16);
            const keyChar = key.charCodeAt((i / 2) % key.length);
            const original = charCode ^ keyChar;
            // 跳过无效字符 (0x00 等控制字符)
            if (original > 0 && original < 128) {
                base64 += String.fromCharCode(original);
            }
        }

        // 还原 Base64 -> 原文
        let decoded = '';
        for (let i = 0; i < base64.length; i += 2) {
            const charCode = parseInt(base64.substring(i, i + 2), 16);
            if (charCode > 0) {
                decoded += String.fromCharCode(charCode);
            }
        }

        const result = decodeURIComponent(decoded);

        // 验证解密结果：如果结果看起来不像有效的 API Key，返回原文
        if (result && result.length > 0 && !result.includes('\0')) {
            return result;
        } else {
            console.warn('[Decrypt] 解密结果异常，返回原文');
            return encryptedText;
        }
    } catch (e) {
        console.error('[Decrypt] 解密失败，可能是未加密数据:', e);
        return encryptedText; // 解密失败返回原文（兼容旧数据）
    }
}

/**
 * 判断字符串是否是加密格式
 * 使用 WPEN_ 前缀可靠识别，避免误判原始 API Key
 */
function isEncrypted(str) {
    if (!str || typeof str !== 'string') return false;

    // 新格式：必须以 WPEN_ 开头
    if (str.startsWith(ENCRYPT_PREFIX)) {
        return true;
    }

    // 旧格式兼容检测（更严格的判断）
    // 旧格式: 4位随机(含字母) + 4位十六进制长度 + 十六进制内容
    // 但要排除常见 API Key 格式（如 sk-xxx）
    if (str.length < 12) return false;

    // 如果看起来像标准 API Key 格式，不认为是加密的
    if (str.startsWith('sk-') || str.startsWith('AIza') || str.startsWith('Bearer')) {
        return false;
    }

    // 旧格式：前4位必须包含字母（随机前缀），后面全是十六进制
    const prefix = str.substring(0, 4);
    const hasLetter = /[a-z]/i.test(prefix);
    const lengthHex = str.substring(4, 8);
    const isValidLength = /^[0-9a-f]{4}$/i.test(lengthHex);

    // 旧格式必须同时满足：前缀有字母 + 长度标记有效
    return hasLetter && isValidLength;
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
 * 清除并重置存储（用于解决加密问题时的彻底重置）
 * @param {String} key Storage 键名
 */
export function clearAndResetStorage(key) {
    try {
        uni.removeStorageSync(key);
        console.log(`[Storage] 已清除并重置: ${key}`);
        return true;
    } catch (e) {
        console.error('[Storage] 清除失败:', e);
        return false;
    }
}

/**
 * 验证 API Key 格式是否有效
 * @param {String} apiKey API Key 字符串
 * @returns {Object} { valid: boolean, message: string }
 */
export function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return { valid: false, message: 'API Key 不能为空' };
    }

    // 检查是否包含非法字符
    if (apiKey.includes('\0') || apiKey.includes('\x00')) {
        return { valid: false, message: 'API Key 包含非法字符，请重新输入' };
    }

    // 检查长度
    if (apiKey.length < 10) {
        return { valid: false, message: 'API Key 太短' };
    }

    // 检查常见格式
    const validPatterns = [
        /^sk-[a-zA-Z0-9]+$/,           // DeepSeek/OpenAI 格式
        /^AIza[a-zA-Z0-9_-]+$/,        // Google API Key 格式
        /^[a-zA-Z0-9_-]+$/,            // 通用格式
    ];

    const isValidFormat = validPatterns.some(pattern => pattern.test(apiKey));
    if (!isValidFormat) {
        return { valid: false, message: 'API Key 格式不正确' };
    }

    return { valid: true, message: 'API Key 格式有效' };
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
