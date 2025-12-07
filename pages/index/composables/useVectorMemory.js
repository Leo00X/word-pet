/**
 * 向量记忆系统 Composable
 * 职责: 语义搜索、向量存储、相似度检索
 * 
 * HCDS Phase 5: 向量存储引擎
 * 
 * 技术方案（简化版）:
 * - 存储: uni.storage (JSON 序列化向量)
 * - Embedding: Gemini Embedding API
 * - 相似度: JavaScript 余弦相似度计算
 * 
 * 注意: 这是轻量级方案，适合小规模数据（<500条）
 * 如需大规模向量检索，需升级为 plus.sqlite + sqlite-vec
 */

import { ref, computed } from 'vue';
import { logSuccess, logError, debugLog } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const STORAGE_KEY = 'vector_memories';
const MAX_VECTORS = 200;  // 最大存储向量数（内存限制）
const EMBEDDING_DIM = 768;  // Gemini Embedding 维度

// Gemini Embedding API 配置
const EMBEDDING_API = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    // API Key 从 aiConfig 获取
};

/**
 * 向量记忆系统
 */
export function useVectorMemory() {
    // ========== 响应式状态 ==========

    // 向量记忆列表
    const memories = ref([]);

    // Embedding 缓存（避免重复调用 API）
    const embeddingCache = ref({});

    // 统计信息
    const stats = ref({
        totalVectors: 0,
        cacheHits: 0,
        apiCalls: 0,
        lastUpdated: null
    });

    // API Key（支持本地持久化）
    let apiKey = '';

    // ========== 计算属性 ==========

    /**
     * 是否已配置 API Key
     */
    const isConfigured = computed(() => !!apiKey);

    // ========== 核心方法 ==========

    /**
     * 设置 API Key (并保存)
     */
    function setApiKey(key) {
        apiKey = key;
        try {
            if (key) {
                uni.setStorageSync('embedding_api_key', key);
            } else {
                uni.removeStorageSync('embedding_api_key');
            }
            debugLog('[VectorMemory] API Key 已更新');
        } catch (e) {
            logError('useVectorMemory', '保存 API Key 失败', e);
        }
    }

    /**
     * 加载 API Key
     */
    function loadApiKey() {
        try {
            const savedKey = uni.getStorageSync('embedding_api_key');
            if (savedKey) {
                apiKey = savedKey;
                debugLog('[VectorMemory] 已加载保存的 API Key');
            }
        } catch (e) {
            // 忽略读取错误
        }
    }

    /**
     * 加载数据
     */
    function loadData() {
        try {
            const saved = uni.getStorageSync(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                memories.value = data.memories || [];
                embeddingCache.value = data.cache || {};
                stats.value = { ...stats.value, ...data.stats };
                debugLog('[VectorMemory] 已加载', memories.value.length, '条向量记忆');
            }
        } catch (err) {
            logError('useVectorMemory', '加载数据失败', err);
        }
    }

    /**
     * 保存数据
     */
    function saveData() {
        try {
            const data = {
                memories: memories.value,
                cache: embeddingCache.value,
                stats: {
                    ...stats.value,
                    totalVectors: memories.value.length,
                    lastUpdated: Date.now()
                }
            };
            uni.setStorageSync(STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            logError('useVectorMemory', '保存数据失败', err);
        }
    }

    /**
     * 生成文本 Embedding
     * @param {string} text - 输入文本
     * @returns {Promise<number[]>} 向量数组
     */
    async function generateEmbedding(text) {
        // 检查缓存
        const cacheKey = text.substring(0, 100);  // 用前100字符做缓存键
        if (embeddingCache.value[cacheKey]) {
            stats.value.cacheHits++;
            return embeddingCache.value[cacheKey];
        }

        if (!apiKey) {
            console.warn('[VectorMemory] 未设置 API Key，使用模拟向量');
            return generateMockEmbedding(text);
        }

        try {
            const response = await new Promise((resolve, reject) => {
                uni.request({
                    url: `${EMBEDDING_API.baseUrl}?key=${apiKey}`,
                    method: 'POST',
                    header: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        model: 'models/text-embedding-004',
                        content: {
                            parts: [{ text: text }]
                        }
                    },
                    success: (res) => resolve(res),
                    fail: (err) => reject(err)
                });
            });

            if (response.statusCode === 200 && response.data.embedding) {
                const embedding = response.data.embedding.values;

                // 缓存结果
                embeddingCache.value[cacheKey] = embedding;
                stats.value.apiCalls++;

                // 限制缓存大小
                const cacheKeys = Object.keys(embeddingCache.value);
                if (cacheKeys.length > 100) {
                    delete embeddingCache.value[cacheKeys[0]];
                }

                return embedding;
            } else {
                console.warn('[VectorMemory] API 响应异常:', response);
                return generateMockEmbedding(text);
            }
        } catch (error) {
            logError('useVectorMemory', 'Embedding API 调用失败', error);
            return generateMockEmbedding(text);
        }
    }

    /**
     * 生成模拟向量（当 API 不可用时的降级方案）
     * 使用文本哈希生成伪向量，仅用于开发测试
     */
    function generateMockEmbedding(text) {
        const vector = new Array(EMBEDDING_DIM).fill(0);

        // 基于文本内容生成伪随机向量
        for (let i = 0; i < text.length && i < 200; i++) {
            const charCode = text.charCodeAt(i);
            vector[i % EMBEDDING_DIM] += charCode / 100;
        }

        // 归一化
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        return vector.map(v => v / (norm || 1));
    }

    /**
     * 计算余弦相似度
     * @param {number[]} vecA - 向量 A
     * @param {number[]} vecB - 向量 B
     * @returns {number} 相似度 (0-1)
     */
    function cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * 添加向量记忆
     * @param {string} content - 文本内容
     * @param {Object} metadata - 元数据
     */
    async function addVectorMemory(content, metadata = {}) {
        const embedding = await generateEmbedding(content);

        const memory = {
            id: `vmem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            content,
            embedding,
            metadata,
            timestamp: Date.now()
        };

        memories.value.push(memory);

        // 限制数量（移除最旧的）
        if (memories.value.length > MAX_VECTORS) {
            memories.value = memories.value.slice(-MAX_VECTORS);
        }

        saveData();
        debugLog('[VectorMemory] 添加向量记忆:', content.substring(0, 30));

        return memory;
    }

    /**
     * 语义搜索
     * @param {string} query - 查询文本
     * @param {number} limit - 返回数量
     * @param {number} threshold - 相似度阈值 (0-1)
     * @returns {Promise<Array>} 相似记忆列表
     */
    async function semanticSearch(query, limit = 5, threshold = 0.3) {
        if (memories.value.length === 0) {
            return [];
        }

        const queryEmbedding = await generateEmbedding(query);

        // 计算所有记忆的相似度
        const results = memories.value
            .map(mem => ({
                ...mem,
                similarity: cosineSimilarity(queryEmbedding, mem.embedding)
            }))
            .filter(mem => mem.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        debugLog('[VectorMemory] 语义搜索:', query, '找到', results.length, '条');

        return results;
    }

    /**
     * 查找相似记忆
     * @param {string} memoryId - 记忆 ID
     * @param {number} limit - 返回数量
     */
    function findSimilar(memoryId, limit = 5) {
        const targetMemory = memories.value.find(m => m.id === memoryId);
        if (!targetMemory) return [];

        return memories.value
            .filter(m => m.id !== memoryId)
            .map(mem => ({
                ...mem,
                similarity: cosineSimilarity(targetMemory.embedding, mem.embedding)
            }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
    }

    /**
     * 清空所有向量记忆
     */
    function clearAllVectorMemories() {
        memories.value = [];
        embeddingCache.value = {};
        stats.value = {
            totalVectors: 0,
            cacheHits: 0,
            apiCalls: 0,
            lastUpdated: null
        };
        saveData();
        logSuccess('向量记忆已清空');
    }

    /**
     * 获取统计信息
     */
    function getStats() {
        return {
            ...stats.value,
            totalVectors: memories.value.length,
            cacheSize: Object.keys(embeddingCache.value).length,
            isConfigured: isConfigured.value
        };
    }

    /**
     * 构建语义上下文（用于 AI Prompt）
     * @param {string} query - 当前话题
     * @param {number} limit - 检索数量
     */
    async function buildSemanticContext(query, limit = 3) {
        const relevantMemories = await semanticSearch(query, limit);

        if (relevantMemories.length === 0) {
            return '';
        }

        const parts = ['# 相关记忆（语义检索）'];

        relevantMemories.forEach((mem, index) => {
            const date = new Date(mem.timestamp).toLocaleDateString();
            parts.push(`${index + 1}. [${date}] ${mem.content} (相似度: ${(mem.similarity * 100).toFixed(0)}%)`);
        });

        return parts.join('\n');
    }

    // ========== 初始化 ==========
    loadData();
    loadApiKey();

    // ========== 返回公开API ==========
    return {
        // 状态
        memories,
        stats,
        isConfigured,

        // 核心方法
        setApiKey,
        addVectorMemory,
        semanticSearch,
        findSimilar,
        buildSemanticContext,

        // 工具方法
        generateEmbedding,
        cosineSimilarity,

        // 数据管理
        loadData,
        saveData,
        clearAllVectorMemories,
        getStats
    };
}
