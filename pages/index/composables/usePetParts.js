/**
 * 宠物部位系统 Composable
 * 职责: 管理宠物身体部位状态、处理部位点击交互、触发 AI 响应
 * 
 * 支持 6 个可点击部位: 头、身体、左手、右手、左脚、右脚
 */
import { ref, computed } from 'vue';
import { debugLog } from '@/utils/debugLog.js';

// ========== 部位配置 ==========
export const PET_PARTS = {
    head: {
        name: '头部',
        emoji: '🤯',
        reactions: ['happy', 'shy', 'sleepy'],
        aiPrompts: ['摸摸头', '揉脑袋', '拍拍头'],
        animations: ['headShake', 'nod', 'tilt'],
        moodChange: { min: 3, max: 8 },
        bondChange: 2
    },
    body: {
        name: '身体',
        emoji: '🫃',
        reactions: ['tickled', 'squish', 'bounce'],
        aiPrompts: ['戳肚子', '揉肚肚', '抱抱'],
        animations: ['bodyBounce', 'squish', 'wiggle'],
        moodChange: { min: 2, max: 6 },
        bondChange: 1
    },
    'left-arm': {
        name: '左手',
        emoji: '🤝',
        reactions: ['wave', 'shake', 'hold'],
        aiPrompts: ['握手', '牵手', '拉左手'],
        animations: ['wave', 'shake', 'pull'],
        moodChange: { min: 4, max: 10 },
        bondChange: 3
    },
    'right-arm': {
        name: '右手',
        emoji: '✋',
        reactions: ['highfive', 'wave', 'punch'],
        aiPrompts: ['击掌', '挥手', '碰右手'],
        animations: ['highfive', 'wave', 'fistbump'],
        moodChange: { min: 4, max: 10 },
        bondChange: 3
    },
    'left-leg': {
        name: '左脚',
        emoji: '🦵',
        reactions: ['kick', 'stomp', 'dance'],
        aiPrompts: ['踢腿', '碰左脚', '跺脚'],
        animations: ['kick', 'stomp', 'wiggle'],
        moodChange: { min: 1, max: 4 },
        bondChange: 1
    },
    'right-leg': {
        name: '右脚',
        emoji: '🦶',
        reactions: ['kick', 'stomp', 'dance'],
        aiPrompts: ['踢踢脚', '碰右脚', '踩踩'],
        animations: ['kick', 'stomp', 'wiggle'],
        moodChange: { min: 1, max: 4 },
        bondChange: 1
    }
};

// ========== Composable ==========
export function usePetParts(options = {}) {
    const {
        floatWindowInstance,
        aiControllerInstance,
        growthInstance,
        onSendToFloat,
        addLog
    } = options;

    // ========== 状态 ==========
    const lastTouchedPart = ref(null);
    const interactionCooldown = ref(false);
    const touchCounts = ref({});  // 记录各部位触摸次数

    // ========== 计算属性 ==========
    const availableParts = computed(() => Object.keys(PET_PARTS));

    const partStats = computed(() => {
        return Object.entries(touchCounts.value).map(([part, count]) => ({
            part,
            name: PET_PARTS[part]?.name || part,
            count
        })).sort((a, b) => b.count - a.count);
    });

    // ========== 核心方法 ==========

    /**
     * 处理部位点击
     * @param {string} partName - 部位名称
     * @param {Object} eventData - 点击事件数据 { x, y, timestamp }
     */
    const handlePartInteraction = async (partName, eventData = {}) => {
        const config = PET_PARTS[partName];
        if (!config) {
            debugLog('[PetParts] 未知部位:', partName);
            return { success: false, error: 'unknown_part' };
        }

        // 冷却检查 (防止连击)
        if (interactionCooldown.value) {
            debugLog('[PetParts] 冷却中，忽略点击');
            return { success: false, error: 'cooldown' };
        }

        interactionCooldown.value = true;
        setTimeout(() => { interactionCooldown.value = false; }, 500);

        debugLog('[PetParts] 部位交互:', partName, config.name);

        // 更新状态
        lastTouchedPart.value = partName;
        touchCounts.value[partName] = (touchCounts.value[partName] || 0) + 1;
        saveTouchCounts();

        // 1. 发送动画指令到悬浮窗
        const animation = getRandomItem(config.animations);
        if (onSendToFloat) {
            onSendToFloat(98, JSON.stringify({
                action: 'part_animation',
                part: partName,
                animation: animation,
                duration: 800
            }));
        }

        // 2. 计算心情和亲密度变化
        const moodChange = randomInRange(config.moodChange.min, config.moodChange.max);
        const bondChange = config.bondChange;

        if (growthInstance) {
            growthInstance.changeMood(moodChange);
            growthInstance.changeBond(bondChange);
            if (addLog) {
                addLog(`${config.emoji} ${config.name}: 心情+${moodChange}, 亲密+${bondChange}`);
            }
        }

        // 3. 请求 AI 响应
        let aiResponse = null;
        if (aiControllerInstance) {
            const prompt = getRandomItem(config.aiPrompts);
            const mood = growthInstance?.mood?.value || 80;

            try {
                aiResponse = await aiControllerInstance.requestResponse({
                    action: prompt,
                    part: partName,
                    partName: config.name,
                    mood: mood,
                    touchCount: touchCounts.value[partName]
                });

                // 显示气泡
                if (onSendToFloat && aiResponse?.text) {
                    onSendToFloat(1, aiResponse.text);
                }
            } catch (err) {
                debugLog('[PetParts] AI 响应失败:', err);
                // 降级：使用本地响应
                const localResponse = getLocalPartResponse(partName, config);
                if (onSendToFloat) {
                    onSendToFloat(1, localResponse);
                }
            }
        } else {
            // 无 AI 时使用本地响应
            const localResponse = getLocalPartResponse(partName, config);
            if (onSendToFloat) {
                onSendToFloat(1, localResponse);
            }
        }

        return {
            success: true,
            part: partName,
            animation,
            moodChange,
            bondChange,
            aiResponse
        };
    };

    /**
     * 获取本地部位响应（AI 降级方案）
     */
    const getLocalPartResponse = (partName, config) => {
        const responses = {
            head: ['嘿嘿，好舒服~', '哇，被摸头了！', '(*≧ω≦) 头好痒~', '再摸摸嘛~'],
            body: ['咯咯咯，好痒！', '呜哇~被戳肚子了', '(>﹏<) 别戳啦', '肚肚不是用来戳的！'],
            'left-arm': ['握手！🤝', '你好你好~', '(*´∀`*) 牵手手', '左手给你啦~'],
            'right-arm': ['击掌！✋', 'Yeah！', '(￣▽￣)ノ High Five!', '耶~'],
            'left-leg': ['踢踢踢~', '别踢我脚！', '(╯°□°)╯', '脚痒痒~'],
            'right-leg': ['跺跺脚！', '踩踩踩~', '٩(๑❛ᴗ❛๑)۶', '右脚也想动~']
        };
        return getRandomItem(responses[partName] || ['喵？']);
    };

    // ========== 工具函数 ==========

    const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // ========== 数据持久化 ==========

    const loadTouchCounts = () => {
        try {
            const data = uni.getStorageSync('pet_part_touch_counts');
            if (data) {
                touchCounts.value = JSON.parse(data);
            }
        } catch (e) {
            debugLog('[PetParts] 加载触摸统计失败:', e);
        }
    };

    const saveTouchCounts = () => {
        try {
            uni.setStorageSync('pet_part_touch_counts', JSON.stringify(touchCounts.value));
        } catch (e) {
            debugLog('[PetParts] 保存触摸统计失败:', e);
        }
    };

    /**
     * 获取部位配置（供悬浮窗使用）
     */
    const getPartsConfig = () => {
        return JSON.parse(JSON.stringify(PET_PARTS));
    };

    /**
     * 重置触摸统计
     */
    const resetTouchCounts = () => {
        touchCounts.value = {};
        saveTouchCounts();
    };

    // 初始化
    loadTouchCounts();

    return {
        // 配置
        PET_PARTS,
        availableParts,
        // 状态
        lastTouchedPart,
        interactionCooldown,
        touchCounts,
        partStats,
        // 方法
        handlePartInteraction,
        getPartsConfig,
        getLocalPartResponse,
        resetTouchCounts,
        loadTouchCounts,
        saveTouchCounts
    };
}
