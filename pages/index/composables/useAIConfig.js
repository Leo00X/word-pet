// pages/index/composables/useAIConfig.js
/**
 * AI 配置管理 Composable
 * 负责管理预置模型和自定义模型的配置、切换、持久化
 */

import { ref, computed } from 'vue';
import { setSecureStorage, getSecureStorage, migrateOldData } from '@/utils/encryptStorage.js';

// 默认配置（初始状态）- API Key 会在保存时自动加密
const DEFAULT_CONFIG = {
    currentModelId: 'gemini-default', // 默认使用 Gemini Flash
    presetModels: [
        {
            id: 'deepseek-default',
            name: 'DeepSeek V3.2',
            type: 'deepseek',
            icon: '🧠',
            description: '高性能对话模型',
            apiKey: '', // 需要用户自行配置
            baseUrl: 'https://api.qnaigc.com/v1/chat/completions',
            modelId: 'deepseek/deepseek-v3.2-251201',
            isPreset: true
        },
        {
            id: 'gemini-default',
            name: 'Gemini 2.5 Flash-Lite',
            type: 'gemini',
            icon: '✨',
            description: '支持思维链推理',
            apiKey: 'AIzaSyBxZVBLUCYMbDBq4ZefROgMAGUVBTiefS4',
            modelId: 'gemini-2.5-flash',
            isPreset: true
        },
        {
            id: 'gemini-2.5-pro',
            name: 'Gemini 2.5 Pro',
            type: 'gemini',
            icon: '💎',
            description: '最强思维能力，深度推理',
            apiKey: 'AIzaSyB5rFGpqZ_HaXHWrFMTXkJIz9DIbksODxw',
            modelId: 'gemini-2.5-pro',
            isPreset: true
        }
    ],
    customModels: []
};


// 响应式状态
const config = ref(null);

/**
 * 初始化配置（从加密存储读取或使用默认值）
 */
function initConfig() {
    if (config.value) return; // 已初始化

    const savedConfig = getSecureStorage('ai_config');
    if (savedConfig) {
        config.value = savedConfig;
    } else {
        // 首次使用，初始化默认配置
        config.value = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        saveConfig();
    }
}

/**
 * 保存配置到加密存储
 */
function saveConfig() {
    setSecureStorage('ai_config', config.value);
}

/**
 * 获取当前激活的模型
 */
const currentModel = computed(() => {
    if (!config.value) return null;

    const id = config.value.currentModelId;

    // 先在预置模型中查找
    let model = config.value.presetModels.find(m => m.id === id);

    // 再在自定义模型中查找
    if (!model) {
        model = config.value.customModels.find(m => m.id === id);
    }

    return model;
});

/**
 * 所有可用模型（预置 + 自定义）
 */
const allModels = computed(() => {
    if (!config.value) return [];
    return [...config.value.presetModels, ...config.value.customModels];
});

/**
 * 切换当前模型
 * @param {String} modelId 模型 ID
 */
function switchModel(modelId) {
    initConfig();

    const model = allModels.value.find(m => m.id === modelId);
    if (!model) {
        throw new Error(`模型不存在: ${modelId}`);
    }

    config.value.currentModelId = modelId;
    saveConfig();

    console.log(`[AI Config] 切换到模型: ${model.name}`);
}

/**
 * 更新模型的 API Key
 * @param {String} modelId 模型 ID
 * @param {String} apiKey 新的 API Key
 */
function updateModelKey(modelId, apiKey) {
    initConfig();

    // 在预置模型中查找
    let model = config.value.presetModels.find(m => m.id === modelId);
    if (model) {
        model.apiKey = apiKey;
        saveConfig();
        console.log(`[AI Config] 更新模型 API Key: ${model.name}`);
        return true;
    }

    // 在自定义模型中查找
    model = config.value.customModels.find(m => m.id === modelId);
    if (model) {
        model.apiKey = apiKey;
        saveConfig();
        console.log(`[AI Config] 更新模型 API Key: ${model.name}`);
        return true;
    }

    return false;
}

/**
 * 添加自定义模型
 * @param {Object} modelConfig 模型配置 { name, baseUrl, apiKey, modelId }
 */
function addCustomModel(modelConfig) {
    initConfig();

    const customModel = {
        id: `custom_${Date.now()}`, // 生成唯一 ID
        name: modelConfig.name,
        type: 'custom',
        icon: '🔧',
        description: '自定义模型',
        apiKey: modelConfig.apiKey,
        baseUrl: modelConfig.baseUrl,
        modelId: modelConfig.modelId,
        isPreset: false
    };

    config.value.customModels.push(customModel);
    saveConfig();

    console.log(`[AI Config] 添加自定义模型: ${customModel.name}`);
    return customModel.id;
}

/**
 * 删除自定义模型
 * @param {String} modelId 模型 ID
 */
function deleteCustomModel(modelId) {
    initConfig();

    const index = config.value.customModels.findIndex(m => m.id === modelId);
    if (index === -1) {
        return false;
    }

    // 如果删除的是当前激活的模型，切换到默认模型
    if (config.value.currentModelId === modelId) {
        config.value.currentModelId = 'deepseek-default';
    }

    config.value.customModels.splice(index, 1);
    saveConfig();

    console.log(`[AI Config] 删除自定义模型: ${modelId}`);
    return true;
}

/**
 * 测试模型连接
 * @param {String} modelId 模型 ID
 * @returns {Promise<Boolean>} 测试是否成功
 */
async function testModelConnection(modelId) {
    initConfig();

    const model = allModels.value.find(m => m.id === modelId);
    if (!model || !model.apiKey) {
        throw new Error('模型配置不完整');
    }

    // 临时导入适配器进行测试
    const { DeepSeekAdapter, GeminiAdapter, CustomAdapter } = await import('@/utils/aiAdapters.js');

    const AdapterMap = {
        'deepseek': DeepSeekAdapter,
        'gemini': GeminiAdapter,
        'custom': CustomAdapter
    };

    const AdapterClass = AdapterMap[model.type];
    if (!AdapterClass) {
        throw new Error('不支持的模型类型');
    }

    const adapter = new AdapterClass(model);

    try {
        // 发送一个简单的测试消息
        const reply = await adapter.chat('测试连接', '请简单回复"连接成功"');
        console.log('[AI Config] 测试连接成功:', reply);
        return true;
    } catch (error) {
        console.error('[AI Config] 测试连接失败:', error);
        throw error;
    }
}

/**
 * 重置配置到默认值
 */
function resetConfig() {
    config.value = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    saveConfig();
    console.log('[AI Config] 配置已重置');
}

/**
 * 导出 Composable
 */
export function useAIConfig() {
    initConfig(); // 确保初始化

    return {
        // 状态
        config: computed(() => config.value),
        currentModel,
        allModels,
        presetModels: computed(() => config.value?.presetModels || []),
        customModels: computed(() => config.value?.customModels || []),
        currentModelId: computed(() => config.value?.currentModelId),

        // 方法
        switchModel,
        updateModelKey,
        addCustomModel,
        deleteCustomModel,
        testModelConnection,
        resetConfig
    };
}
