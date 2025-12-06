/**
 * AI 多模态控制器 Composable
 * 职责: 构建结构化 Prompt，解析 AI 返回的动作指令
 * 
 * 输出格式: { text, emotion, action, duration, bubble_color }
 */
import { ref } from 'vue';
import { aiService } from '@/utils/aiService.js';
import { debugLog, logAI, logError } from '@/utils/debugLog.js';

// ========== 默认回复配置 ==========
const DEFAULT_RESPONSES = {
    happy: { text: '嘿嘿~', action: 'jump', emotion: 'happy', duration: 1000, bubbleColor: '#4CAF50' },
    sad: { text: '呜...', action: 'hide', emotion: 'sad', duration: 1500, bubbleColor: '#2196F3' },
    angry: { text: '哼！', action: 'shake', emotion: 'angry', duration: 1200, bubbleColor: '#F44336' },
    neutral: { text: '...', action: 'idle', emotion: 'neutral', duration: 800, bubbleColor: '#9E9E9E' }
};

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
    const { maxTextLength = 50, timeout = 5000 } = options;

    // 状态
    const isLoading = ref(false);
    const lastResponse = ref(null);
    const errorCount = ref(0);

    /**
     * 构建多模态 Prompt
     * @param {Object} context - 交互上下文
     * @returns {string}
     */
    const buildPrompt = (context) => {
        const { action, mood, level, studyMinutes = 0, gestureType = '' } = context;

        return `你是一只住在手机桌面的傲娇电子宠物"寄生兽"。

【用户行为】: ${action}
【手势类型】: ${gestureType}
【当前心情】: ${mood}/100
【当前等级】: Lv.${level}
【今日学习】: ${studyMinutes} 分钟

请返回 JSON 格式（不要有其他文字）:
{
  "text": "30字以内对话，可用emoji",
  "emotion": "happy|sad|angry|surprised|sleepy",
  "action": "jump|wave|hide|spin|shake|nod|idle",
  "duration": 500-2000,
  "bubble_color": "#颜色代码"
}

示例:
用户抚摸 + 心情70 → {"text":"嘿嘿，再摸一下~","emotion":"happy","action":"jump","duration":800,"bubble_color":"#4CAF50"}
用户摸鱼中 + 心情20 → {"text":"去背单词！💢","emotion":"angry","action":"shake","duration":1000,"bubble_color":"#F44336"}`;
    };

    /**
     * 请求 AI 多模态响应
     * @param {Object} context - 交互上下文
     * @returns {Promise<Object>}
     */
    const requestResponse = async (context) => {
        isLoading.value = true;

        try {
            const prompt = buildPrompt(context);
            logAI('请求多模态响应', { context });

            const response = await Promise.race([
                aiService.sendMessage(prompt, { temperature: 0.8 }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI 响应超时')), timeout)
                )
            ]);

            const parsed = parseAIResponse(response);
            lastResponse.value = parsed;
            errorCount.value = 0;

            logAI('AI 响应解析成功', parsed);
            return parsed;

        } catch (error) {
            logError('AIController', error);
            errorCount.value++;

            // 降级返回本地响应
            return getFallbackResponse(context.mood);
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * 解析 AI 返回的 JSON
     * @param {string} response 
     * @returns {Object}
     */
    const parseAIResponse = (response) => {
        try {
            // 尝试提取 JSON
            let jsonStr = response;
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }

            const parsed = JSON.parse(jsonStr);

            // 验证并规范化
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
            // 尝试从文本中提取有用信息
            return extractFromText(response);
        }
    };

    /**
     * 从非结构化文本中提取信息
     * @param {string} text 
     * @returns {Object}
     */
    const extractFromText = (text) => {
        // 检测情感关键词
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
     * 获取本地降级响应
     * @param {number} mood 
     * @returns {Object}
     */
    const getFallbackResponse = (mood = 50) => {
        if (mood > 70) return DEFAULT_RESPONSES.happy;
        if (mood > 40) return DEFAULT_RESPONSES.neutral;
        if (mood > 20) return DEFAULT_RESPONSES.sad;
        return DEFAULT_RESPONSES.angry;
    };

    /**
     * 快速本地响应（不调用 AI）
     * @param {string} gestureType 
     * @param {number} mood 
     * @returns {Object}
     */
    const getLocalResponse = (gestureType, mood = 50) => {
        const responses = {
            'TAP': ['嘿~', '干嘛？', '在呢！'],
            'DOUBLE_TAP': ['打开菜单~', '来玩吗？'],
            'LONG_PRESS': ['别按太久~', '痒痒的！'],
            'THROW': ['呜哇！', '别甩我！'],
            'SWIPE': ['嘿！', '躲开！']
        };

        const texts = responses[gestureType] || ['...'];
        const text = texts[Math.floor(Math.random() * texts.length)];

        const fallback = getFallbackResponse(mood);
        return { ...fallback, text };
    };

    return {
        // 状态
        isLoading,
        lastResponse,
        errorCount,
        // 方法
        requestResponse,
        getLocalResponse,
        getFallbackResponse,
        // 常量
        AVAILABLE_ACTIONS,
        AVAILABLE_EMOTIONS
    };
}
