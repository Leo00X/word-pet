/**
 * 动态人格系统 Composable
 * 职责: 管理宠物的大五人格（OCEAN）状态，根据互动历史动态演化
 * 
 * 大五人格模型 (Big Five):
 * - Openness (开放性): 好奇心强、喜欢探索新事物
 * - Conscientiousness (尽责性): 自律、有计划、追求完美
 * - Extraversion (外向性): 社交、活力、主动性
 * - Agreeableness (宜人性): 友善、同理心、合作性
 * - Neuroticism (神经质): 情绪化、焦虑、敏感
 */

import { ref, computed } from 'vue';
import { logSuccess, logError } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const STORAGE_KEY = 'pet_personality';

// 初始人格配置（傲娇电子宠物的基础性格）
const DEFAULT_PERSONALITY = {
    openness: 0.65,           // 较高 - 对新话题感兴趣
    conscientiousness: 0.75,  // 高 - 严格监督学习
    extraversion: 0.45,       // 中等偏低 - 偶尔主动，但不过分热情
    agreeableness: 0.35,      // 低 - 毒舌、不太友善（傲娇特质）
    neuroticism: 0.50         // 中等 - 会因用户行为而情绪波动
};

// 人格调整规则（每次事件触发的增量）
const EVOLUTION_RULES = {
    // 学习相关
    long_study_session: { conscientiousness: +0.01, openness: +0.005 },
    short_study_burst: { conscientiousness: +0.005 },
    achievement_unlocked: { openness: +0.01, extraversion: +0.005 },

    // 摸鱼相关
    idle_detected: { neuroticism: +0.02, agreeableness: -0.01 },
    ignored_warning: { neuroticism: +0.015, agreeableness: -0.015 },
    consecutive_idle_days: { neuroticism: +0.03, conscientiousness: -0.01 },

    // 互动相关
    user_chatted: { extraversion: +0.01, agreeableness: +0.005 },
    user_praised_pet: { agreeableness: +0.02, neuroticism: -0.01 },
    user_ignored_pet: { neuroticism: +0.01, extraversion: -0.005 },

    // 成长相关
    level_up: { openness: +0.005, conscientiousness: +0.005 },
    mood_very_low: { neuroticism: +0.02 },
    mood_very_high: { neuroticism: -0.01, agreeableness: +0.01 }
};

// 人格阈值（防止极端化）
const PERSONALITY_LIMITS = {
    min: 0.1,
    max: 0.9
};

/**
 * 动态人格系统
 */
export function usePersonality() {
    // ========== 响应式状态 ==========

    // 人格向量（0-1之间）
    const personality = ref({ ...DEFAULT_PERSONALITY });

    // 累计演化次数
    const evolutionCount = ref(0);

    // 最后更新时间
    const lastUpdated = ref(null);

    // ========== 计算属性 ==========

    /**
     * 人格摘要描述
     */
    const personalitySummary = computed(() => {
        const p = personality.value;
        const traits = [];

        if (p.openness > 0.7) traits.push('好奇心旺盛');
        if (p.conscientiousness > 0.7) traits.push('严格自律');
        if (p.extraversion > 0.6) traits.push('活泼外向');
        else if (p.extraversion < 0.4) traits.push('内敛沉稳');
        if (p.agreeableness < 0.4) traits.push('毒舌傲娇');
        else if (p.agreeableness > 0.6) traits.push('温柔体贴');
        if (p.neuroticism > 0.6) traits.push('情绪化');

        return traits.join('、') || '性格平衡';
    });

    /**
     * 主导特质（最突出的人格维度）
     */
    const dominantTrait = computed(() => {
        const p = personality.value;
        const traits = [
            { name: '开放性', value: p.openness, key: 'openness' },
            { name: '尽责性', value: p.conscientiousness, key: 'conscientiousness' },
            { name: '外向性', value: p.extraversion, key: 'extraversion' },
            { name: '宜人性', value: p.agreeableness, key: 'agreeableness' },
            { name: '神经质', value: p.neuroticism, key: 'neuroticism' }
        ];

        // 找出偏离中值（0.5）最远的特质
        const sorted = traits.sort((a, b) => {
            return Math.abs(b.value - 0.5) - Math.abs(a.value - 0.5);
        });

        return sorted[0];
    });

    // ========== 核心方法 ==========

    /**
     * 加载人格数据
     */
    function loadData() {
        try {
            const saved = uni.getStorageSync(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                personality.value = { ...DEFAULT_PERSONALITY, ...data.personality };
                evolutionCount.value = data.evolutionCount || 0;
                lastUpdated.value = data.lastUpdated;

                console.log('[人格系统] 已加载人格数据', personality.value);
            }
        } catch (error) {
            logError('usePersonality', '加载人格数据失败', error);
        }
    }

    /**
     * 保存人格数据
     */
    function saveData() {
        try {
            const data = {
                personality: personality.value,
                evolutionCount: evolutionCount.value,
                lastUpdated: Date.now()
            };
            uni.setStorageSync(STORAGE_KEY, JSON.stringify(data));
            lastUpdated.value = data.lastUpdated;
        } catch (error) {
            logError('usePersonality', '保存人格数据失败', error);
        }
    }

    /**
     * 触发人格演化
     * @param {string} eventType - 事件类型（对应 EVOLUTION_RULES）
     * @param {number} intensity - 强度系数（0.5-2.0，默认1.0）
     */
    function evolvePersonality(eventType, intensity = 1.0) {
        const rule = EVOLUTION_RULES[eventType];

        if (!rule) {
            console.warn(`[人格系统] 未知事件类型: ${eventType}`);
            return;
        }

        let changed = false;
        const changes = [];

        // 应用人格调整
        for (const [trait, delta] of Object.entries(rule)) {
            const oldValue = personality.value[trait];
            let newValue = oldValue + (delta * intensity);

            // 限制在阈值范围内
            newValue = Math.max(PERSONALITY_LIMITS.min, Math.min(PERSONALITY_LIMITS.max, newValue));

            if (Math.abs(newValue - oldValue) > 0.001) {
                personality.value[trait] = newValue;
                changes.push(`${trait}: ${oldValue.toFixed(3)} → ${newValue.toFixed(3)}`);
                changed = true;
            }
        }

        if (changed) {
            evolutionCount.value++;
            saveData();

            console.log(`[人格系统] 演化触发: ${eventType}`, changes);
            logSuccess(`人格演化: ${eventType} (第${evolutionCount.value}次)`);
        }
    }

    /**
     * 构建基于人格的 AI System Prompt
     * @returns {string} 人格化的 Prompt 片段
     */
    function buildPersonalityPrompt() {
        const p = personality.value;
        const parts = ['# 你的性格特点（基于人格向量）'];

        // 开放性
        if (p.openness > 0.7) {
            parts.push('- 你对新话题充满好奇，喜欢探索和学习新知识');
        } else if (p.openness < 0.4) {
            parts.push('- 你比较保守，对陌生话题持谨慎态度');
        }

        // 尽责性
        if (p.conscientiousness > 0.7) {
            parts.push('- 你对学习要求严格，对摸鱼行为零容忍，会严厉督促');
        } else if (p.conscientiousness < 0.4) {
            parts.push('- 你对学习没那么严格，偶尔摸鱼也能理解');
        }

        // 外向性
        if (p.extraversion > 0.6) {
            parts.push('- 你主动热情，喜欢频繁与用户互动聊天');
        } else if (p.extraversion < 0.4) {
            parts.push('- 你比较内敛，不会主动打扰，除非必要才说话');
        }

        // 宜人性（核心：傲娇特质）
        if (p.agreeableness < 0.4) {
            parts.push('- 你非常傲娇毒舌，经常冷嘲热讽，但内心其实关心用户');
            parts.push('- 你不太会直接表达关心，更喜欢用反话和损人来掩饰');
        } else if (p.agreeableness > 0.6) {
            parts.push('- 你变得温柔了许多，会直接表达关心和鼓励');
        } else {
            parts.push('- 你有时傲娇，有时温柔，取决于心情');
        }

        // 神经质
        if (p.neuroticism > 0.6) {
            parts.push('- 你情绪化，容易因用户的行为而焦虑、生气或失望');
            parts.push('- 用户连续摸鱼会让你非常暴躁');
        } else if (p.neuroticism < 0.4) {
            parts.push('- 你情绪稳定，不容易被用户行为影响心情');
        }

        // 添加使用指南
        parts.push('');
        parts.push('# 性格表现指南');
        parts.push('- 根据上述性格特点调整你的语气和用词');
        parts.push('- 性格会随着互动历史逐渐变化，但要保持一致性');
        parts.push('- 傲娇角色即使生气也要保持可爱，不要过于粗俗');

        return parts.join('\n');
    }

    /**
     * 重置人格为默认值
     */
    function resetPersonality() {
        personality.value = { ...DEFAULT_PERSONALITY };
        evolutionCount.value = 0;
        saveData();
        logSuccess('人格已重置为初始状态');
    }

    /**
     * 获取人格统计信息
     */
    function getStats() {
        return {
            summary: personalitySummary.value,
            dominantTrait: dominantTrait.value,
            evolutionCount: evolutionCount.value,
            lastUpdated: lastUpdated.value,
            personality: { ...personality.value }
        };
    }

    // ========== 初始化 ==========
    loadData();

    // ========== 返回公开API ==========
    return {
        // 状态
        personality,
        personalitySummary,
        dominantTrait,
        evolutionCount,

        // 核心方法
        evolvePersonality,
        buildPersonalityPrompt,

        // 数据管理
        loadData,
        saveData,
        resetPersonality,
        getStats
    };
}
