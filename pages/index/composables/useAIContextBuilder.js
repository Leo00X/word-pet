/**
 * AI 上下文增强器 Composable
 * 职责: 构建带上下文的增强 Prompt，整合记忆系统和对话历史
 * 
 * Phase 3 核心模块：
 * - 对话历史上下文
 * - 记忆检索增强
 * - 多级降级策略
 * 
 * 遵循 Bug 防范指南：
 * - 功能闭环：所有方法都有调用点
 * - 集成参数完整：传递所有必要依赖
 */
import { ref, computed } from 'vue';
import { debugLog, logAI } from '@/utils/debugLog.js';

// ========== 上下文配置 ==========
const CONTEXT_CONFIG = {
    maxHistoryMessages: 10,      // 最大历史消息数
    maxMemoryItems: 5,           // 最大记忆条目数
    maxPromptLength: 2000,       // 最大 Prompt 长度
    contextWindowSize: 4096      // 上下文窗口大小估算
};

// Prompt 模板
const PROMPT_TEMPLATES = {
    // 基础角色设定
    baseRole: `你是一只住在手机桌面的傲娇电子宠物"寄生兽"。
性格：傲娇、毒舌但内心善良，会关心主人的学习。
说话风格：简短(30字以内)，可用emoji，偶尔犀利吐槽。`,

    // 记忆增强模板
    memoryContext: `
【长期记忆】
主人名字: {userName}
主人偏好: {preferences}
重要事件: {events}`,

    // 当前状态模板
    stateContext: `
【当前状态】
心情: {mood}/100 ({moodDesc})
等级: Lv.{level}
今日学习: {studyMinutes} 分钟
当前时间: {timeDesc}`,

    // 行为树状态
    behaviorContext: `
【行为状态】
根状态: {rootState}
子状态: {subState}`,

    // 输出格式要求
    outputFormat: `
请返回 JSON 格式（不要有其他文字）:
{
  "text": "30字以内对话，可用emoji",
  "emotion": "happy|sad|angry|surprised|sleepy|excited|shy",
  "action": "jump|wave|hide|spin|shake|nod|idle|celebrate|scared",
  "duration": 500-2000,
  "bubble_color": "#颜色代码"
}`
};

// ========== Composable ==========
export function useAIContextBuilder(options = {}) {
    const { memorySystem, behaviorTree } = options;

    // 状态
    const lastContext = ref(null);
    const contextTokenEstimate = ref(0);

    /**
     * 构建增强版 Prompt（带记忆和历史）
     * @param {Object} params - 构建参数
     * @returns {Object} { systemPrompt, userMessage, history }
     */
    const buildEnhancedPrompt = (params) => {
        const {
            action,
            gestureType = '',
            mood = 50,
            level = 1,
            studyMinutes = 0,
            rootState = 'IDLE',
            subState = 'idle_normal',
            currentMessage = ''
        } = params;

        // 1. 构建基础系统 Prompt
        let systemPrompt = PROMPT_TEMPLATES.baseRole;

        // 2. 添加记忆上下文（如果有记忆系统）
        if (memorySystem) {
            const memoryContext = buildMemorySection(memorySystem);
            if (memoryContext) {
                systemPrompt += memoryContext;
            }
        }

        // 3. 添加当前状态
        systemPrompt += buildStateSection({ mood, level, studyMinutes });

        // 4. 添加行为状态
        systemPrompt += buildBehaviorSection({ rootState, subState });

        // 5. 添加输出格式
        systemPrompt += PROMPT_TEMPLATES.outputFormat;

        // 6. 构建用户消息
        const userMessage = buildUserMessage({ action, gestureType, currentMessage });

        // 7. 获取对话历史
        const history = getFormattedHistory(memorySystem);

        // 估算 token 数量
        contextTokenEstimate.value = estimateTokens(systemPrompt, userMessage, history);

        const context = { systemPrompt, userMessage, history };
        lastContext.value = context;

        logAI('[Context] 构建增强 Prompt', {
            systemLength: systemPrompt.length,
            userLength: userMessage.length,
            historyCount: history.length,
            estimatedTokens: contextTokenEstimate.value
        });

        return context;
    };

    /**
     * 构建记忆部分
     */
    const buildMemorySection = (memory) => {
        if (!memory || !memory.facts) return '';

        const facts = memory.facts.value || {};
        const userName = facts.userName || '主人';
        const preferences = facts.preferences?.join('、') || '暂无';
        const events = (facts.events || []).slice(-3).map(e => e.content).join('; ') || '暂无';

        return PROMPT_TEMPLATES.memoryContext
            .replace('{userName}', userName)
            .replace('{preferences}', preferences)
            .replace('{events}', events);
    };

    /**
     * 构建状态部分
     */
    const buildStateSection = ({ mood, level, studyMinutes }) => {
        const hour = new Date().getHours();
        const timeDesc = hour < 6 ? '深夜' : hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
        const moodDesc = mood > 70 ? '开心' : mood > 40 ? '一般' : mood > 20 ? '低落' : '愤怒';

        return PROMPT_TEMPLATES.stateContext
            .replace('{mood}', mood)
            .replace('{moodDesc}', moodDesc)
            .replace('{level}', level)
            .replace('{studyMinutes}', studyMinutes)
            .replace('{timeDesc}', timeDesc);
    };

    /**
     * 构建行为状态部分
     */
    const buildBehaviorSection = ({ rootState, subState }) => {
        return PROMPT_TEMPLATES.behaviorContext
            .replace('{rootState}', rootState)
            .replace('{subState}', subState);
    };

    /**
     * 构建用户消息
     */
    const buildUserMessage = ({ action, gestureType, currentMessage }) => {
        let message = '';

        if (gestureType) {
            message = `[手势: ${gestureType}] `;
        }

        if (action) {
            message += `用户${action}`;
        }

        if (currentMessage) {
            message += currentMessage;
        }

        return message || '用户触摸了宠物';
    };

    /**
     * 获取格式化的对话历史
     */
    const getFormattedHistory = (memory) => {
        if (!memory || !memory.getHistoryForAI) return [];

        try {
            const history = memory.getHistoryForAI(CONTEXT_CONFIG.maxHistoryMessages);
            return history.map(item => ({
                role: item.role === 'pet' ? 'assistant' : item.role,
                content: item.content
            }));
        } catch (e) {
            debugLog('[Context] 获取历史失败:', e);
            return [];
        }
    };

    /**
     * 估算 Token 数量
     */
    const estimateTokens = (systemPrompt, userMessage, history) => {
        // 简单估算：中文约 1.5 字符/token，英文约 4 字符/token
        const totalChars = systemPrompt.length + userMessage.length +
            history.reduce((sum, h) => sum + (h.content?.length || 0), 0);
        return Math.ceil(totalChars / 2);
    };

    /**
     * 获取压缩版 Prompt（用于降级场景）
     */
    const buildCompactPrompt = (params) => {
        const { mood, action, gestureType } = params;

        const systemPrompt = `你是傲娇电子宠物。回复JSON格式:{"text":"20字以内","emotion":"happy|sad|angry","action":"jump|idle|shake"}`;
        const userMessage = `心情${mood}/100，用户${action || gestureType || '触摸'}`;

        return { systemPrompt, userMessage, history: [] };
    };

    /**
     * 获取最小化 Prompt（极端降级）
     */
    const buildMinimalPrompt = (params) => {
        return {
            systemPrompt: '回复一句话(20字内)',
            userMessage: params.action || '你好',
            history: []
        };
    };

    return {
        // 状态
        lastContext,
        contextTokenEstimate,
        // 方法
        buildEnhancedPrompt,
        buildCompactPrompt,
        buildMinimalPrompt,
        // 配置
        CONTEXT_CONFIG,
        PROMPT_TEMPLATES
    };
}
