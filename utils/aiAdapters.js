// utils/aiAdapters.js
/**
 * AI 适配器实现
 * 为不同的 AI 平台提供统一的调用接口
 * 支持多轮对话上下文
 */

/**
 * DeepSeek 适配器（基于原有代码重构）
 */
export class DeepSeekAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'https://api.qnaigc.com/v1/chat/completions';
        this.modelId = config.modelId || 'deepseek/deepseek-v3.2-251201';
    }

    chat(userMessage, systemPrompt = "你是一个毒舌的电子宠物，说话简短犀利。", history = []) {
        return new Promise((resolve, reject) => {
            // 构建消息数组：system + history + current
            const messages = [
                { role: "system", content: systemPrompt }
            ];

            // 智能上下文截断策略
            const MAX_CHARS = 3000; // 最大上下文及字符数
            let currentChars = systemPrompt.length + userMessage.length;
            const validHistory = [];

            // 倒序遍历历史，添加直到超过限制
            for (let i = history.length - 1; i >= 0; i--) {
                const msg = history[i];
                const content = msg.content || '';

                // 如果单条消息过长，进行截断（保留前500字）
                const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;

                if (currentChars + truncatedContent.length > MAX_CHARS) {
                    break;
                }

                currentChars += truncatedContent.length;
                validHistory.unshift({ role: msg.role, content: truncatedContent });

                // 最多保留 10 轮
                if (validHistory.length >= 10) break;
            }

            messages.push(...validHistory);

            // 添加当前消息
            messages.push({ role: "user", content: userMessage });

            uni.request({
                url: this.baseUrl,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                data: {
                    model: this.modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 200
                },
                success: (res) => {
                    if (res.statusCode === 200 && res.data?.choices?.[0]?.message) {
                        resolve(res.data.choices[0].message.content);
                    } else {
                        console.error('[DeepSeek] API Error:', res);
                        reject(res.data || { error: { message: '请求失败' } });
                    }
                },
                fail: (err) => {
                    console.error('[DeepSeek] Network Error:', err);
                    reject({ error: { message: err.errMsg || '网络错误' } });
                }
            });
        });
    }
}

/**
 * Gemini 适配器（使用原生 Gemini API）
 * 官方文档：https://ai.google.dev/gemini-api/docs/text-generation
 */
export class GeminiAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.modelId = config.modelId || 'gemini-2.5-flash';
        // 原生 Gemini API 端点
        this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}:generateContent`;
    }

    chat(userMessage, systemPrompt = "你是一个毒舌的电子宠物，说话简短犀利。", history = []) {
        return new Promise((resolve, reject) => {
            const contents = [];

            // 智能上下文截断策略
            const MAX_CHARS = 4000; // Gemini 支持更长上下文
            let currentChars = systemPrompt.length + userMessage.length;
            const validHistory = [];

            // 倒序遍历历史
            for (let i = history.length - 1; i >= 0; i--) {
                const msg = history[i];
                const content = msg.content || '';

                // 截断过长历史消息
                const truncatedContent = content.length > 800 ? content.substring(0, 800) + '...' : content;

                if (currentChars + truncatedContent.length > MAX_CHARS) {
                    break;
                }

                currentChars += truncatedContent.length;
                validHistory.unshift({ role: msg.role, content: truncatedContent });

                if (validHistory.length >= 10) break;
            }

            if (validHistory.length > 0) {
                // 第一条消息包含 system prompt
                const firstMsg = validHistory[0];
                // 确保第一条是 user 角色（Gemini 要求）
                if (firstMsg.role === 'user') {
                    contents.push({
                        role: "user",
                        parts: [{ text: systemPrompt + "\n\n" + firstMsg.content }]
                    });
                } else {
                    // 如果第一条是 model，强行插入一个 user system prompt
                    contents.push({
                        role: "user",
                        parts: [{ text: systemPrompt }]
                    });
                    contents.push({
                        role: "model",
                        parts: [{ text: firstMsg.content }]
                    });
                }

                // 添加后续历史消息
                for (let i = 1; i < validHistory.length; i++) {
                    const msg = validHistory[i];
                    contents.push({
                        role: msg.role === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.content }]
                    });
                }

                // 添加当前消息 (如果最后一条历史不是当前消息)
                const lastMsg = validHistory[validHistory.length - 1];
                if (!lastMsg || lastMsg.content !== userMessage) {
                    contents.push({
                        role: "user",
                        parts: [{ text: userMessage }]
                    });
                }
            } else {
                // 没有历史，直接包含 system prompt
                contents.push({
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\n${userMessage}` }]
                });
            }

            console.log(`[Gemini] 发送上下文: ${validHistory.length} 条历史, 约 ${currentChars} 字符`);

            uni.request({
                url: this.baseUrl,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                data: { contents },
                success: (res) => {
                    if (res.statusCode === 200 && res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        resolve(res.data.candidates[0].content.parts[0].text);
                    } else {
                        console.error('[Gemini] API Error:', res);
                        if (res.data?.promptFeedback?.blockReason) {
                            reject({
                                error: {
                                    message: `内容被安全过滤: ${res.data.promptFeedback.blockReason}`
                                }
                            });
                        } else {
                            reject(res.data || { error: { message: '请求失败' } });
                        }
                    }
                },
                fail: (err) => {
                    console.error('[Gemini] Network Error:', err);
                    reject({ error: { message: err.errMsg || '网络错误' } });
                }
            });
        });
    }
}

/**
 * 自定义适配器（用户提供的 OpenAI 兼容 API）
 */
export class CustomAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl;
        this.modelId = config.modelId;
        this.name = config.name || '自定义模型';
    }

    chat(userMessage, systemPrompt = "你是一个毒舌的电子宠物，说话简短犀利。", history = []) {
        return new Promise((resolve, reject) => {
            // 构建消息数组
            const messages = [
                { role: "system", content: systemPrompt }
            ];

            // 智能上下文截断策略
            const MAX_CHARS = 3000;
            let currentChars = systemPrompt.length + userMessage.length;
            const validHistory = [];

            for (let i = history.length - 1; i >= 0; i--) {
                const msg = history[i];
                const content = msg.content || '';
                const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;

                if (currentChars + truncatedContent.length > MAX_CHARS) {
                    break;
                }

                currentChars += truncatedContent.length;
                validHistory.unshift({ role: msg.role, content: truncatedContent });

                if (validHistory.length >= 10) break;
            }

            messages.push(...validHistory);

            // 添加当前消息
            messages.push({ role: "user", content: userMessage });

            uni.request({
                url: this.baseUrl,
                method: 'POST',
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                data: {
                    model: this.modelId,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 200
                },
                success: (res) => {
                    if (res.statusCode === 200 && res.data?.choices?.[0]?.message) {
                        resolve(res.data.choices[0].message.content);
                    } else {
                        console.error(`[${this.name}] API Error:`, res);
                        reject(res.data || { error: { message: '请求失败' } });
                    }
                },
                fail: (err) => {
                    console.error(`[${this.name}] Network Error:`, err);
                    reject({ error: { message: err.errMsg || '网络错误' } });
                }
            });
        });
    }
}
