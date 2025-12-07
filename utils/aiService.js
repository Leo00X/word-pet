// utils/aiService.js
/**
 * AI 服务统一入口
 * 负责根据配置动态选择合适的 AI 适配器
 */

import { DeepSeekAdapter, GeminiAdapter, CustomAdapter } from './aiAdapters.js';
import { getSecureStorage } from './encryptStorage.js';

// 适配器工厂映射
const ADAPTER_MAP = {
    'deepseek': DeepSeekAdapter,
    'gemini': GeminiAdapter,
    'custom': CustomAdapter
};

/**
 * 获取所有配置了 API Key 的可用模型
 * @param {String} preferredType - 优先模型类型 (可选)
 * @returns {Array} 按优先级排序的模型列表
 */
function getAvailableModels(preferredType = null) {
    const config = getSecureStorage('ai_config');
    if (!config) return [];

    const allModels = [
        ...(config.presetModels || []),
        ...(config.customModels || [])
    ];

    // 过滤出有 API Key 的模型
    const availableModels = allModels.filter(m => m.apiKey && m.apiKey.length > 0);

    // 如果指定了优先类型，将该类型的模型排在前面
    if (preferredType) {
        availableModels.sort((a, b) => {
            const aMatch = a.type === preferredType || a.id?.includes(preferredType) || a.name?.toLowerCase().includes(preferredType);
            const bMatch = b.type === preferredType || b.id?.includes(preferredType) || b.name?.toLowerCase().includes(preferredType);
            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
            return 0;
        });
    }

    return availableModels;
}

/**
 * Promise 超时包装器
 * @param {Promise} promise - 原始 Promise
 * @param {Number} ms - 超时毫秒数
 * @returns {Promise} 带超时的 Promise
 */
function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`请求超时 (${ms}ms)`));
        }, ms);

        promise
            .then(result => {
                clearTimeout(timer);
                resolve(result);
            })
            .catch(err => {
                clearTimeout(timer);
                reject(err);
            });
    });
}

/**
 * 带自动重试和模型轮询的 AI 调用
 * 当一个模型超时或出错时，自动切换到下一个可用模型
 * 
 * @param {String} userMessage - 用户消息
 * @param {String} systemPrompt - 系统提示词
 * @param {Object} options - 配置项
 *   - timeout: 超时时间 (ms)，默认 15000
 *   - preferredType: 优先模型类型 (如 'gemini', 'deepseek')
 *   - onModelSwitch: 模型切换回调 (modelName, currentIndex, totalCount)
 *   - history: 历史消息数组
 * @returns {Promise<String>} AI 回复
 */
export async function chatWithFallback(userMessage, systemPrompt, options = {}) {
    const {
        timeout = 15000,
        preferredType = null,
        onModelSwitch = null,
        history = []
    } = options;

    // 获取所有可用模型
    const models = getAvailableModels(preferredType);

    if (models.length === 0) {
        throw new Error('没有可用的 AI 模型，请先配置 API Key');
    }

    console.log(`[AI Fallback] 共有 ${models.length} 个可用模型: ${models.map(m => m.name).join(', ')}`);

    const errors = [];

    // 依次尝试每个模型
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        const AdapterClass = ADAPTER_MAP[model.type];

        if (!AdapterClass) {
            console.warn(`[AI Fallback] 跳过不支持的模型类型: ${model.type}`);
            continue;
        }

        // 触发模型切换回调
        if (onModelSwitch) {
            onModelSwitch(model.name, i + 1, models.length);
        }

        console.log(`[AI Fallback] 尝试模型 ${i + 1}/${models.length}: ${model.name}`);

        try {
            const adapter = new AdapterClass(model);
            const result = await withTimeout(
                adapter.chat(userMessage, systemPrompt, history),
                timeout
            );

            console.log(`[AI Fallback] ${model.name} 调用成功`);
            return result;
        } catch (error) {
            const errorMsg = error.message || error.error?.message || '未知错误';
            console.warn(`[AI Fallback] ${model.name} 失败: ${errorMsg}`);
            errors.push({ model: model.name, error: errorMsg });

            // 如果是最后一个模型，抛出所有错误信息
            if (i === models.length - 1) {
                const allErrors = errors.map(e => `${e.model}: ${e.error}`).join('; ');
                throw new Error(`所有模型都失败了 - ${allErrors}`);
            }
        }
    }
}

/**
 * 获取当前激活的 AI 配置
 * @returns {Object} AI 配置对象，如果未配置返回默认值
 */
function getCurrentAIConfig() {
    const config = getSecureStorage('ai_config');

    // 如果没有配置，返回空配置（需要用户自行配置 API Key）
    if (!config) {
        return {
            currentModelId: 'deepseek-default',
            currentModel: {
                id: 'deepseek-default',
                name: 'DeepSeek V3.2',
                type: 'deepseek',
                apiKey: '', // 需要用户配置
                baseUrl: 'https://api.qnaigc.com/v1/chat/completions',
                modelId: 'deepseek/deepseek-v3.2-251201'
            }
        };
    }

    // 找到当前激活的模型配置
    const currentModelId = config.currentModelId;
    let currentModel = null;

    // 先在预置模型中查找
    currentModel = config.presetModels?.find(m => m.id === currentModelId);

    // 如果预置模型中没有，再在自定义模型中查找
    if (!currentModel) {
        currentModel = config.customModels?.find(m => m.id === currentModelId);
    }

    // 如果还是找不到，使用第一个预置模型
    if (!currentModel && config.presetModels?.length > 0) {
        currentModel = config.presetModels[0];
    }

    return {
        currentModelId,
        currentModel
    };
}

/**
 * 统一的 AI 聊天接口
 * @param {String} userMessage 用户消息
 * @param {String} systemPrompt 系统提示词
 * @param {Array} history 历史对话 [{role: 'user'|'assistant', content: '...'}]
 * @returns {Promise<String>} AI 回复
 */
export function chatWithAI(userMessage, systemPrompt = "你是一个毒舌的电子宠物，说话简短犀利。", history = []) {
    const { currentModel } = getCurrentAIConfig();

    if (!currentModel) {
        return Promise.reject({ error: { message: '未配置 AI 模型' } });
    }

    if (!currentModel.apiKey) {
        return Promise.reject({ error: { message: `${currentModel.name} 未配置 API Key` } });
    }

    // 根据模型类型选择适配器
    const AdapterClass = ADAPTER_MAP[currentModel.type];

    if (!AdapterClass) {
        return Promise.reject({ error: { message: `不支持的模型类型: ${currentModel.type}` } });
    }

    // 创建适配器实例并调用（传递历史）
    const adapter = new AdapterClass(currentModel);
    console.log(`[AI Service] 使用模型: ${currentModel.name} (${currentModel.type}), 历史消息: ${history.length} 条`);

    return adapter.chat(userMessage, systemPrompt, history);
}

/**
 * 使用指定模型调用 AI（用于日记等需要特定模型的场景）
 * @param {String} modelType 模型类型: 'gemini-pro', 'gemini-flash', 'deepseek' 等
 * @param {String} userMessage 用户消息
 * @param {String} systemPrompt 系统提示词
 * @returns {Promise<String>} AI 回复
 */
export function chatWithSpecificModel(modelType, userMessage, systemPrompt) {
    const config = getSecureStorage('ai_config');

    if (!config) {
        return Promise.reject({ error: { message: '未配置 AI 模型' } });
    }

    // 查找指定类型的模型
    let targetModel = null;

    // 优先在预置模型中查找 Gemini Pro
    if (modelType === 'gemini-pro') {
        targetModel = config.presetModels?.find(m =>
            m.id === 'gemini-pro' || m.name?.includes('Pro')
        );
    } else if (modelType === 'gemini-flash') {
        targetModel = config.presetModels?.find(m =>
            m.id?.includes('flash') || m.name?.includes('Flash')
        );
    } else {
        targetModel = config.presetModels?.find(m => m.type === modelType);
    }

    // 如果没找到，fallback 到当前模型
    if (!targetModel) {
        console.warn(`[AI Service] 未找到模型 ${modelType}，使用当前模型`);
        return chatWithAI(userMessage, systemPrompt);
    }

    if (!targetModel.apiKey) {
        return Promise.reject({ error: { message: `${targetModel.name} 未配置 API Key` } });
    }

    const AdapterClass = ADAPTER_MAP[targetModel.type];
    if (!AdapterClass) {
        return Promise.reject({ error: { message: `不支持的模型类型: ${targetModel.type}` } });
    }

    const adapter = new AdapterClass(targetModel);
    console.log(`[AI Service] 日记专用模型: ${targetModel.name}`);

    return adapter.chat(userMessage, systemPrompt, []);
}

/**
 * 导出配置获取函数供其他模块使用
 */
export { getCurrentAIConfig };
