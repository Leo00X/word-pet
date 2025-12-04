// utils/deepseek.js

// 配置项：请将你的 API Key 填入这里
// ⚠️ 注意：实际项目中，请不要将 Key 直接提交到 Git，建议使用 manifest 环境变量或从后端获取
const API_KEY = 'sk-b6a294d4157fdca97c842ccb0a61dec55c091b9d3dc50056631cb7665cb07b98'; 
const BASE_URL = 'https://api.qnaigc.com/v1/chat/completions';
const MODEL_ID = 'deepseek/deepseek-v3.2-251201'; // 截图中的 Model ID

/**
 * 发送消息给 DeepSeek AI
 * @param {String} userMessage 用户输入的内容 (比如：我今天摸鱼了2小时)
 * @param {String} systemPrompt 系统人设 (比如：你是一个毒舌宠物)
 * @returns {Promise<String>} AI的回复
 */
export const chatWithAI = (userMessage, systemPrompt = "你是一个毒舌的电子宠物，说话简短犀利。") => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL,
			method: 'POST',
			header: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${API_KEY}`
			},
			data: {
				model: MODEL_ID,
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userMessage }
				],
				temperature: 0.7, // 创意程度 (0-1)
				max_tokens: 200   // 限制回复长度，避免废话
			},
			success: (res) => {
				// OpenAI 格式的返回结构通常在 choices[0].message.content
				if (res.statusCode === 200 && res.data?.choices?.[0]?.message) {
					resolve(res.data.choices[0].message.content);
				} else {
					console.error('API Error:', res);
					reject(res.data || '请求失败');
				}
			},
			fail: (err) => {
				console.error('Network Error:', err);
				reject(err);
			}
		});
	});
};