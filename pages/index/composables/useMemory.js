/**
 * AI 记忆系统 Composable（增强版 v2.0）
 * 职责: 存储关键对话、提取关键信息、构建上下文记忆
 * 
 * 新增功能:
 * - 记忆分类（事实/事件/情感/对话）
 * - 时间衰减权重（旧记忆逐渐淡化）
 * - 改进的检索算法（混合匹配）
 * - 简化知识图谱（实体-关系三元组）
 * 
 * 架构:
 * - conversations: 最近100条对话记录
 * - facts: 提取的关键事实（用户名、偏好等）
 * - knowledgeGraph: 简易三元组存储
 * - tags: 对话标签（用于快速检索）
 */
import { ref, computed } from 'vue';
import { debugLog, logError, logSuccess } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const MEMORY_STORAGE_KEY = 'ai_memory';
const KNOWLEDGE_GRAPH_KEY = 'knowledge_graph';
const MAX_CONVERSATIONS = 100;  // 最大存储对话数
const MAX_CONTEXT_MESSAGES = 10; // 发送给AI的最大历史消息数

// 记忆分类
const MEMORY_TYPES = {
    FACT: 'fact',           // 事实（用户名、偏好）
    EVENT: 'event',         // 事件（学习30分钟、解锁成就）
    EMOTION: 'emotion',     // 情感（高兴、难过）
    CONVERSATION: 'conversation'  // 普通对话
};

// 时间衰减配置
const TIME_DECAY = {
    HALF_LIFE_DAYS: 7,      // 半衰期：7天后重要性减半
    MIN_WEIGHT: 0.1         // 最小权重（再旧也不会完全归零）
};

// 关键词提取规则
const KEYWORD_PATTERNS = {
    userName: [
        /我叫(.{1,8})/,
        /我是(.{1,8})/,
        /我的名字是(.{1,8})/,
        /叫我(.{1,8})/
    ],
    petName: [
        /给你取名(.{1,10})/,
        /你叫(.{1,10})/,
        /你的名字是(.{1,10})/
    ],
    favoriteApp: [
        /我喜欢用(.{2,15})学习/,
        /我在用(.{2,15})背单词/
    ],
    mood: [
        /我(很开心|开心|高兴|快乐)/,
        /我(很难过|难过|伤心|不开心)/,
        /我(很累|累了|好累)/,
        /我(很烦|烦躁|心烦)/
    ]
};

// 重要度评分规则
const IMPORTANCE_RULES = {
    personal_info: 5,    // 个人信息（名字等）
    emotional: 4,        // 情绪表达
    achievement: 4,      // 成就相关
    long_message: 3,     // 长消息
    question: 2,         // 问题
    greeting: 1          // 问候
};

/**
 * AI记忆系统（增强版）
 */
export function useMemory() {
    // ========== 响应式状态 ==========

    // 对话记录
    const conversations = ref([]);

    // 提取的事实
    const facts = ref({
        userName: null,
        petName: null,
        favoriteApp: null,
        lastMood: null,
        firstMeetDate: null,
        totalChats: 0
    });

    // 简易知识图谱（三元组：subject-predicate-object）
    const knowledgeGraph = ref([]);

    // 统计信息
    const stats = ref({
        totalMemories: 0,
        lastUpdated: null
    });

    // ========== 计算属性 ==========

    /**
     * 格式化的用户信息摘要
     */
    const userSummary = computed(() => {
        const f = facts.value;
        const parts = [];

        if (f.userName) parts.push(`用户名: ${f.userName}`);
        if (f.petName) parts.push(`宠物名: ${f.petName}`);
        if (f.favoriteApp) parts.push(`常用学习App: ${f.favoriteApp}`);
        if (f.totalChats > 0) parts.push(`累计对话: ${f.totalChats}次`);

        return parts.length > 0 ? parts.join(', ') : '暂无记忆';
    });

    /**
     * 最近的对话摘要（用于AI上下文）
     */
    const recentContext = computed(() => {
        return conversations.value
            .slice(-MAX_CONTEXT_MESSAGES)
            .map(c => ({
                role: c.role,
                content: c.content
            }));
    });

    // ========== 核心方法 ==========

    /**
     * 加载记忆数据
     */
    function loadData() {
        try {
            const saved = uni.getStorageSync(MEMORY_STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                conversations.value = data.conversations || [];
                facts.value = { ...facts.value, ...data.facts };
                stats.value = data.stats || stats.value;
                debugLog('[记忆系统]', `已加载 ${conversations.value.length} 条记忆`);
            }
        } catch (err) {
            logError('useMemory', '加载记忆失败', err);
        }
    }

    /**
     * 保存记忆数据
     */
    function saveData() {
        try {
            const data = {
                conversations: conversations.value,
                facts: facts.value,
                stats: {
                    ...stats.value,
                    totalMemories: conversations.value.length,
                    lastUpdated: Date.now()
                }
            };
            uni.setStorageSync(MEMORY_STORAGE_KEY, JSON.stringify(data));
        } catch (err) {
            logError('useMemory', '保存记忆失败', err);
        }
    }

    /**
     * 添加对话记忆
     * @param {string} role - 角色 'user' | 'pet' | 'system'
     * @param {string} content - 对话内容
     * @param {Object} metadata - 附加信息
     */
    function addMemory(role, content, metadata = {}) {
        // 计算重要度
        const importance = calculateImportance(role, content);

        // 提取关键词标签
        const tags = extractTags(content);

        // 创建记忆条目
        const memory = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role,
            content,
            timestamp: Date.now(),
            importance,
            tags,
            ...metadata
        };

        // 添加到列表
        conversations.value.push(memory);

        // 限制数量
        if (conversations.value.length > MAX_CONVERSATIONS) {
            // 保留高重要度的记忆
            conversations.value = pruneMemories(conversations.value, MAX_CONVERSATIONS);
        }

        // 提取事实
        if (role === 'user') {
            extractFacts(content);
            facts.value.totalChats = (facts.value.totalChats || 0) + 1;
        }

        // 保存
        saveData();

        debugLog('[记忆系统]', `添加记忆: ${content.substring(0, 30)}... [重要度: ${importance}]`);
    }

    /**
     * 计算消息重要度
     * @param {string} role - 角色
     * @param {string} content - 内容
     * @returns {number} 1-5的重要度
     */
    function calculateImportance(role, content) {
        let score = 1;

        // 用户消息通常更重要
        if (role === 'user') score += 1;

        // 检查个人信息
        for (const pattern of KEYWORD_PATTERNS.userName) {
            if (pattern.test(content)) {
                return IMPORTANCE_RULES.personal_info;
            }
        }

        // 检查情绪表达
        for (const pattern of KEYWORD_PATTERNS.mood) {
            if (pattern.test(content)) {
                score = Math.max(score, IMPORTANCE_RULES.emotional);
            }
        }

        // 长消息更重要
        if (content.length > 50) {
            score = Math.max(score, IMPORTANCE_RULES.long_message);
        }

        // 问题更重要
        if (content.includes('?') || content.includes('？')) {
            score = Math.max(score, IMPORTANCE_RULES.question);
        }

        return Math.min(5, score);
    }

    /**
     * 提取标签
     * @param {string} content - 内容
     * @returns {Array<string>} 标签列表
     */
    function extractTags(content) {
        const tags = [];

        // 检查各种模式
        if (KEYWORD_PATTERNS.userName.some(p => p.test(content))) {
            tags.push('用户信息');
        }
        if (KEYWORD_PATTERNS.petName.some(p => p.test(content))) {
            tags.push('宠物命名');
        }
        if (KEYWORD_PATTERNS.mood.some(p => p.test(content))) {
            tags.push('情绪');
        }
        if (content.includes('学习') || content.includes('背单词')) {
            tags.push('学习');
        }
        if (content.includes('成就') || content.includes('解锁')) {
            tags.push('成就');
        }

        return tags;
    }

    /**
     * 提取并存储事实
     * @param {string} content - 用户消息内容
     */
    function extractFacts(content) {
        // 提取用户名
        for (const pattern of KEYWORD_PATTERNS.userName) {
            const match = content.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim().replace(/[。，,.]*/g, '');
                if (name.length > 0 && name.length <= 8) {
                    facts.value.userName = name;
                    logSuccess(`记住了用户名: ${name}`);
                    break;
                }
            }
        }

        // 提取宠物名
        for (const pattern of KEYWORD_PATTERNS.petName) {
            const match = content.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim().replace(/[。，,.]*/g, '');
                if (name.length > 0 && name.length <= 10) {
                    facts.value.petName = name;
                    logSuccess(`记住了宠物名: ${name}`);
                    break;
                }
            }
        }

        // 记录首次见面日期
        if (!facts.value.firstMeetDate) {
            facts.value.firstMeetDate = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * 精简记忆（保留高重要度）
     * @param {Array} memories - 记忆列表
     * @param {number} limit - 保留数量
     * @returns {Array} 精简后的列表
     */
    function pruneMemories(memories, limit) {
        // 按重要度和时间排序
        const sorted = [...memories].sort((a, b) => {
            // 首先按重要度
            if (b.importance !== a.importance) {
                return b.importance - a.importance;
            }
            // 然后按时间（新的优先）
            return b.timestamp - a.timestamp;
        });

        // 保留前N条
        return sorted.slice(0, limit);
    }

    /**
     * 搜索相关记忆
     * @param {string} query - 搜索词
     * @param {number} limit - 返回数量
     * @returns {Array} 匹配的记忆
     */
    function searchMemories(query, limit = 5) {
        const keywords = query.toLowerCase().split(/\s+/);

        return conversations.value
            .filter(mem => {
                const content = mem.content.toLowerCase();
                return keywords.some(kw => content.includes(kw));
            })
            .sort((a, b) => b.importance - a.importance)
            .slice(0, limit);
    }

    /**
     * 构建AI上下文提示
     * @param {Object} currentContext - 当前上下文（等级、心情等）
     * @returns {string} 记忆增强的系统提示
     */
    function buildMemoryPrompt(currentContext = {}) {
        const parts = [];

        // 基础信息
        parts.push('# 记忆片段');

        // 用户信息
        if (facts.value.userName) {
            parts.push(`- 用户自称: ${facts.value.userName}`);
        }
        if (facts.value.petName) {
            parts.push(`- 你的名字: ${facts.value.petName}（用户给你取的）`);
        }
        if (facts.value.firstMeetDate) {
            parts.push(`- 初次见面: ${facts.value.firstMeetDate}`);
        }
        if (facts.value.totalChats > 0) {
            parts.push(`- 累计对话: ${facts.value.totalChats}次`);
        }

        // 最近重要对话
        const importantRecent = conversations.value
            .filter(m => m.importance >= 3)
            .slice(-5)
            .map(m => `[${m.role}]: ${m.content.substring(0, 50)}...`);

        if (importantRecent.length > 0) {
            parts.push('\n# 重要对话片段');
            parts.push(importantRecent.join('\n'));
        }

        // 提示使用记忆
        parts.push('\n# 使用指南');
        parts.push('- 如果用户问"你还记得吗"，请引用上述记忆');
        parts.push('- 适时提及用户名或宠物名会让对话更亲切');
        parts.push('- 不要编造不存在的记忆');

        return parts.join('\n');
    }

    /**
     * 获取对话历史（用于发送给AI）
     * @param {number} limit - 数量限制
     * @returns {Array} 格式化的历史
     */
    function getHistoryForAI(limit = MAX_CONTEXT_MESSAGES) {
        return conversations.value
            .slice(-limit)
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));
    }

    /**
     * 清除所有记忆
     */
    function clearAllMemories() {
        conversations.value = [];
        facts.value = {
            userName: null,
            petName: null,
            favoriteApp: null,
            lastMood: null,
            firstMeetDate: null,
            totalChats: 0
        };
        saveData();
        logSuccess('已清除所有记忆');
    }

    /**
     * 获取记忆统计
     */
    function getStats() {
        return {
            totalMemories: conversations.value.length,
            highImportance: conversations.value.filter(m => m.importance >= 4).length,
            factsKnown: Object.values(facts.value).filter(v => v !== null).length,
            oldestMemory: conversations.value[0]?.timestamp,
            newestMemory: conversations.value[conversations.value.length - 1]?.timestamp,
            knowledgeTriples: knowledgeGraph.value.length
        };
    }

    // ========== 增强功能 (v2.0) ==========

    /**
     * 计算时间衰减权重
     * @param {number} timestamp - 记忆时间戳
     * @returns {number} 衰减权重 (0.1-1.0)
     */
    function calculateTimeDecayWeight(timestamp) {
        const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        const halfLife = TIME_DECAY.HALF_LIFE_DAYS;

        // 指数衰减公式: weight = 0.5^(age / halfLife)
        const weight = Math.pow(0.5, ageInDays / halfLife);

        // 限制最小权重
        return Math.max(TIME_DECAY.MIN_WEIGHT, weight);
    }

    /**
     * 自动分类记忆类型
     * @param {string} content - 记忆内容
     * @param {Array} tags - 标签
     * @param {number} importance - 重要性
     * @returns {string} 记忆类型
     */
    function classifyMemoryType(content, tags, importance) {
        // 事实：个人信息
        if (tags.includes('用户信息') || tags.includes('宠物命名')) {
            return MEMORY_TYPES.FACT;
        }

        // 情感：情绪相关
        if (tags.includes('情绪')) {
            return MEMORY_TYPES.EMOTION;
        }

        // 事件：成就、学习
        if (tags.includes('成就') || tags.includes('学习')) {
            return MEMORY_TYPES.EVENT;
        }

        // 默认：对话
        return MEMORY_TYPES.CONVERSATION;
    }

    /**
     * 添加知识三元组
     * @param {string} subject - 主语（如：用户、宠物）
     * @param {string} predicate - 谓语（如：使用、喜欢、解锁）
     * @param {string} object - 宾语（如：墨墨背单词、学习）
     */
    function addTriple(subject, predicate, object) {
        const triple = {
            id: `triple_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            subject,
            predicate,
            object,
            timestamp: Date.now()
        };

        // 检查是否已存在相同三元组
        const exists = knowledgeGraph.value.some(t =>
            t.subject === subject &&
            t.predicate === predicate &&
            t.object === object
        );

        if (!exists) {
            knowledgeGraph.value.push(triple);
            saveKnowledgeGraph();
            console.log(`[知识图谱] 添加三元组: ${subject} → ${predicate} → ${object}`);
        }
    }

    /**
     * 查询知识图谱
     * @param {Object} query - 查询条件 { subject?, predicate?, object? }
     * @returns {Array} 匹配的三元组
     */
    function queryKnowledgeGraph(query) {
        return knowledgeGraph.value.filter(triple => {
            if (query.subject && triple.subject !== query.subject) return false;
            if (query.predicate && triple.predicate !== query.predicate) return false;
            if (query.object && triple.object !== query.object) return false;
            return true;
        });
    }

    /**
     * 保存知识图谱
     */
    function saveKnowledgeGraph() {
        try {
            uni.setStorageSync(KNOWLEDGE_GRAPH_KEY, JSON.stringify(knowledgeGraph.value));
        } catch (err) {
            logError('useMemory', '保存知识图谱失败', err);
        }
    }

    /**
     * 加载知识图谱
     */
    function loadKnowledgeGraph() {
        try {
            const saved = uni.getStorageSync(KNOWLEDGE_GRAPH_KEY);
            if (saved) {
                knowledgeGraph.value = JSON.parse(saved);
                console.log(`[知识图谱] 已加载 ${knowledgeGraph.value.length} 条三元组`);
            }
        } catch (err) {
            logError('useMemory', '加载知识图谱失败', err);
        }
    }

    /**
     * 增强的记忆检索（考虑时间衰减）
     * @param {string} query - 查询词
     * @param {number} limit - 返回数量
     * @returns {Array} 按相关性排序的记忆
     */
    function smartSearch(query, limit = 5) {
        const keywords = query.toLowerCase().split(/\s+/);

        const results = conversations.value
            .filter(mem => {
                const content = mem.content.toLowerCase();
                return keywords.some(kw => content.includes(kw));
            })
            .map(mem => {
                // 计算综合得分：重要性 × 时间衰减权重
                const timeWeight = calculateTimeDecayWeight(mem.timestamp);
                const score = mem.importance * timeWeight;

                return { ...mem, score, timeWeight };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        return results;
    }

    // ========== 初始化 ==========
    loadData();
    loadKnowledgeGraph();

    // ========== 返回公开API ==========
    return {
        // 状态
        conversations,
        facts,
        knowledgeGraph,  // 新增
        stats,
        userSummary,
        recentContext,

        // 核心方法
        addMemory,
        searchMemories,
        buildMemoryPrompt,
        getHistoryForAI,

        // 增强功能 (v2.0)
        smartSearch,  // 新增：智能检索
        addTriple,  // 新增：添加知识三元组
        queryKnowledgeGraph,  // 新增：查询知识图谱
        calculateTimeDecayWeight,  // 新增：时间衰减

        // 数据管理
        loadData,
        saveData,
        clearAllMemories,
        getStats
    };
}
