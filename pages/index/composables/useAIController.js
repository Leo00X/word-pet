/**
 * AI 多模态控制器 Composable (Phase 3 增强版)
 * 职责: 构建结构化 Prompt，解析 AI 返回的动作指令
 * 
 * Phase 3 新增：
 * - 对话历史上下文
 * - 记忆检索增强
 * - 多级降级策略
 * 
 * 输出格式: { text, emotion, action, duration, bubble_color }
 */
import { ref, computed } from 'vue';
import { chatWithAI } from '@/utils/aiService.js';
import { debugLog, logAI, logError } from '@/utils/debugLog.js';
import { useAIContextBuilder } from './useAIContextBuilder.js';
import { useAIFallback } from './useAIFallback.js';

// 可用的动作列表
export const AVAILABLE_ACTIONS = [
    'idle', 'jump', 'wave', 'hide', 'spin', 'shake',
    'nod', 'sleep', 'celebrate', 'scared', 'shy'
];

// 可用的表情列表
export const AVAILABLE_EMOTIONS = [
    'happy', 'sad', 'angry', 'surprised', 'sleepy',
    'proud', 'shy', 'excited', 'neutral'
];

// ========== Composable ==========
export function useAIController(options = {}) {
    const {
        maxTextLength = 50,
        memorySystem = null,      // [新] 记忆系统集成
        behaviorTree = null       // [新] 行为树状态集成
    } = options;

    // 集成子模块
    const contextBuilder = useAIContextBuilder({ memorySystem, behaviorTree });
    const fallback = useAIFallback();

    // 状态
    const isLoading = ref(false);
    const lastResponse = ref(null);
    const lastContext = ref(null);

    /**
     * [增强] 请求 AI 多模态响应（带上下文和降级）
     * @param {Object} context - 交互上下文
     * @returns {Promise<Object>}
     */
    const requestResponse = async (context) => {
        isLoading.value = true;

        try {
            // 根据当前降级级别选择策略
            const level = fallback.currentLevel.value;

            if (level >= 2) {
                // Level 2/3: 使用本地响应
                return handleLocalResponse(context, level);
            }

            // Level 0/1: 调用 AI
            const result = await requestAIWithLevel(context, level);
            fallback.recordSuccess();
            return result;

        } catch (error) {
            logError('AIController', error);
            fallback.recordFailure(error);

            // 降级后重试
            return handleFallbackResponse(context);
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * 根据级别调用 AI
     */
    const requestAIWithLevel = async (context, level) => {
        // 获取行为树状态
        const btState = behaviorTree ? {
            rootState: behaviorTree.rootState?.value || 'IDLE',
            subState: behaviorTree.subState?.value || 'idle_normal'
        } : {};

        // 构建完整上下文
        const fullContext = { ...context, ...btState };

        // 根据级别构建 Prompt
        const promptData = level === 0
            ? contextBuilder.buildEnhancedPrompt(fullContext)
            : contextBuilder.buildCompactPrompt(fullContext);

        lastContext.value = promptData;

        logAI('[AI] 请求 Level', level, { context: fullContext });

        // 调用 AI
        const response = await Promise.race([
            chatWithAI(promptData.userMessage, promptData.systemPrompt, promptData.history),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('AI 响应超时')), fallback.currentTimeout.value)
            )
        ]);

        // 解析响应
        const parsed = parseAIResponse(response);
        lastResponse.value = parsed;

        // 如果有记忆系统，记录这次交互
        if (memorySystem && memorySystem.addMemory) {
            memorySystem.addMemory('user', promptData.userMessage);
            memorySystem.addMemory('pet', parsed.text);
        }

        logAI('[AI] 响应成功', parsed);
        return parsed;
    };

    /**
     * 处理本地响应（Level 2/3）
     */
    const handleLocalResponse = (context, level) => {
        const eventType = context.gestureType || context.action || 'TAP';
        const mood = context.mood || 50;

        const response = level === 2
            ? fallback.getTemplateResponse(eventType, mood)
            : fallback.getStaticResponse(mood);

        lastResponse.value = response;
        logAI('[AI] 本地响应 Level', level, response);
        return response;
    };

    /**
     * 处理降级响应
     */
    const handleFallbackResponse = (context) => {
        const level = fallback.currentLevel.value;
        return handleLocalResponse(context, level);
    };

    /**
     * 解析 AI 返回的 JSON
     */
    const parseAIResponse = (response) => {
        try {
            let jsonStr = response;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            const parsed = JSON.parse(jsonStr);

            return {
                text: String(parsed.text || '...').slice(0, maxTextLength),
                emotion: AVAILABLE_EMOTIONS.includes(parsed.emotion) ? parsed.emotion : 'neutral',
                action: AVAILABLE_ACTIONS.includes(parsed.action) ? parsed.action : 'idle',
                duration: Math.max(500, Math.min(parsed.duration || 1000, 3000)),
                bubbleColor: /^#[0-9A-Fa-f]{6}$/.test(parsed.bubble_color)
                    ? parsed.bubble_color : '#667eea'
            };
        } catch (e) {
            debugLog('[AI] JSON 解析失败:', e.message);
            return extractFromText(response);
        }
    };

    /**
     * 从非结构化文本中提取信息
     */
    const extractFromText = (text) => {
        let emotion = 'neutral';
        let action = 'idle';
        let color = '#667eea';

        if (/开心|嘿嘿|哈哈|好耶|棒/.test(text)) {
            emotion = 'happy'; action = 'jump'; color = '#4CAF50';
        } else if (/生气|愤怒|讨厌|💢/.test(text)) {
            emotion = 'angry'; action = 'shake'; color = '#F44336';
        } else if (/伤心|难过|呜|😢/.test(text)) {
            emotion = 'sad'; action = 'hide'; color = '#2196F3';
        }

        return {
            text: text.slice(0, maxTextLength),
            emotion,
            action,
            duration: 1000,
            bubbleColor: color
        };
    };

    /**
     * 快速本地响应（不调用 AI）
     */
    const getLocalResponse = (gestureType, mood = 50) => {
        return fallback.getTemplateResponse(gestureType, mood);
    };

    /**
     * 获取降级状态
     */
    const getFallbackStats = () => fallback.getStats();

    /**
     * 强制重置降级状态
     */
    const resetFallback = () => fallback.reset();

    // 计算属性
    const isUsingAI = computed(() => fallback.currentLevel.value < 2);
    const fallbackLevel = computed(() => fallback.currentLevel.value);

    return {
        // 状态
        isLoading,
        lastResponse,
        lastContext,
        // 计算属性
        isUsingAI,
        fallbackLevel,
        // 子模块
        contextBuilder,
        fallback,
        // 方法
        requestResponse,
        getLocalResponse,
        getFallbackStats,
        resetFallback,
        // 常量
        AVAILABLE_ACTIONS,
        AVAILABLE_EMOTIONS
    };
}

