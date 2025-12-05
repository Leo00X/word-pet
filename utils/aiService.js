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
 * 导出配置获取函数供其他模块使用
 */
export { getCurrentAIConfig };
