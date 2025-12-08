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
    const aiTriggerCounter = ref(0);  // 累积点击计数（用于 AI 触发策略）

    // ========== AI 触发策略配置 ==========
    const AI_TRIGGER_CONFIG = {
        minClicks: 3,           // 最少点击 3 次后开始随机
        maxClicks: 8,           // 点击 8 次必触发 AI
        baseProbability: 0.30,  // 基础 30% 概率
        moodBonus: 0.15         // 高心情(>80)额外 15% 概率
    };

    /**
     * 判断是否应该触发 AI
     * @param {number} mood - 当前心情值
     * @returns {boolean}
     */
    const shouldTriggerAI = (mood = 50) => {
        aiTriggerCounter.value++;

        // 点击次数 < 最小次数：100% 本地
        if (aiTriggerCounter.value < AI_TRIGGER_CONFIG.minClicks) {
            debugLog('[PetParts] 点击次数不足，使用本地:', aiTriggerCounter.value);
            return false;
        }

        // 点击次数 >= 最大次数：100% AI 并重置
        if (aiTriggerCounter.value >= AI_TRIGGER_CONFIG.maxClicks) {
            debugLog('[PetParts] 达到最大点击，触发 AI');
            aiTriggerCounter.value = 0;
            return true;
        }

        // 计算概率：基础概率 + 心情加成
        let probability = AI_TRIGGER_CONFIG.baseProbability;
        if (mood > 80) {
            probability += AI_TRIGGER_CONFIG.moodBonus;
        }

        const shouldTrigger = Math.random() < probability;
        debugLog('[PetParts] AI 触发判断:', {
            clicks: aiTriggerCounter.value,
            probability,
            mood,
            triggered: shouldTrigger
        });

        if (shouldTrigger) {
            aiTriggerCounter.value = 0;  // 触发后重置
        }

        return shouldTrigger;
    };

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

        // 3. 根据策略决定使用本地词库还是 AI
        const mood = growthInstance?.mood?.value || 50;
        let aiResponse = null;

        if (aiControllerInstance && shouldTriggerAI(mood)) {
            // 触发 AI 响应
            const prompt = getRandomItem(config.aiPrompts);

            try {
                debugLog('[PetParts] 触发 AI 响应...');
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
                debugLog('[PetParts] AI 响应失败，降级本地:', err);
                const localResponse = getLocalPartResponse(partName, config, mood);
                if (onSendToFloat) {
                    onSendToFloat(1, localResponse);
                }
            }
        } else {
            // 使用本地词库响应（节省 token）
            const localResponse = getLocalPartResponse(partName, config, mood);
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
     * 获取本地部位响应（根据心情选择）
     * @param {string} partName - 部位名称
     * @param {Object} config - 部位配置
     * @param {number} mood - 心情值 (0-100)
     */
    const getLocalPartResponse = (partName, config, mood = 50) => {
        // 心情分级词库
        const moodResponses = {
            head: {
                happy: [
                    '嘿嘿~超级舒服！✨', '耶！被摸头超开心！', '(*≧ω≦) 再摸再摸!', '头顶发光了~💡',
                    '好喜欢被这样摸摸~😊', '感觉充满了能量！⚡', '嘻嘻，你也开心吗？', '摸得我好想睡觉觉~😴'
                ],
                normal: [
                    '嘿嘿，好舒服~', '哇，被摸头了！', '(*≧ω≦) 头好痒~', '再摸摸嘛~',
                    '你的手好暖和呀~', '蹭蹭你的手~', '摸摸头会长不高的！🤨', '好痒好痒哈哈哈！'
                ],
                sad: [
                    '嗯...谢谢你', '(´；ω；`) 好暖', '摸摸也许能好点...', '...',
                    '有点不想说话...', '希望能开心起来...', '谢谢你的安慰...', '(´-ω-`) 嗯...'
                ]
            },
            body: {
                happy: [
                    '咯咯咯~痒死啦！😆', '抱抱我嘛~', '呜哇~肚肚被戳！', '嘻嘻嘻~',
                    '肚肚是软软的吗？', '别闹啦哈哈哈！', '再戳我就要反击啦！', '好痒好痒受不了啦！'
                ],
                normal: [
                    '咯咯咯，好痒！', '呜哇~被戳肚子了', '(>﹏<) 别戳啦', '肚肚不是用来戳的！',
                    '也许我该减肥了？🤔', '戳出一个洞怎么办！', '那是我的开关吗？', '好奇怪的感觉...'
                ],
                sad: [
                    '轻点...', '(っ´ω`c) 好累', '没力气躲了...', '...',
                    '别闹了...', '只想静静...', '...不想动', '肚子不舒服...'
                ]
            },
            'left-arm': {
                happy: [
                    '握手握手！🤝✨', '牵手手超棒！', '(*´∀`*) 左手给你！', '耶！朋友！',
                    '抓紧我哦！', '这是友谊的证明！', '我们的手一样大吗？', '摇一摇~晃一晃~'
                ],
                normal: [
                    '握手！🤝', '你好你好~', '(*´∀`*) 牵手手', '左手给你啦~',
                    '拉勾上吊一百年不许变！', '这是一只幸运的左手！', '可以牵着我去玩吗？', '握手通常表示友好！'
                ],
                sad: [
                    '...牵着我', '别松手好吗', '(´；ω；`)', '...',
                    '我需要一点力量...', '拉住我...', '有点冷...', '...嗯'
                ]
            },
            'right-arm': {
                happy: [
                    'High Five!!!✋🔥', 'Yeah！！！', '(￣▽￣)ノ 耶耶耶!', '击掌成功！💥',
                    '我们是最棒的拍档！', '默契满分！💯', '再来一次！啪！', '充满力量的一击！'
                ],
                normal: [
                    '击掌！✋', 'Yeah！', '(￣▽￣)ノ High Five!', '耶~',
                    'Give me five!', '你的手速好快！', '啪！响亮的一声！', '这就是默契！'
                ],
                sad: [
                    '...', '没力气抬手了', '(´-ω-`)', '...',
                    '下次再击掌吧...', '手好重...', '没什么心情...', '唉...'
                ]
            },
            'left-leg': {
                happy: [
                    '踢踢踢~跳舞！💃', '蹦蹦跳跳！', '٩(๑❛ᴗ❛๑)۶ 左脚开心！', '踩踩踩~',
                    '像弹簧一样！', '我要跳到月球上去！🚀', '这就是节奏感！', '左脚先迈出第一步！'
                ],
                normal: [
                    '踢踢踢~', '别踢我脚！', '(╯°□°)╯', '脚痒痒~',
                    '这双鞋好看吗？', '小心别被我绊倒！', '我在练无影脚！', '动次打次~'
                ],
                sad: [
                    '...不想动', '脚好沉', '(´-ω-`)', '...',
                    '走不动了...', '想休息...', '每一步都好累...', '...'
                ]
            },
            'right-leg': {
                happy: [
                    '跺跺跳跳！🦶✨', '右脚也要动！', '٩(๑❛ᴗ❛๑)۶ Yeah!', '踩踩踩~',
                    '右脚也不甘示弱！', '踢踏舞时间！', '地板在震动！', '充满活力的右脚！'
                ],
                normal: [
                    '跺跺脚！', '踩踩踩~', '٩(๑❛ᴗ❛๑)۶', '右脚也想动~',
                    '这只脚比较灵活！', '我在打拍子！', '咚咚咚！', '别踩到我！'
                ],
                sad: [
                    '...', '累', '不想动', '...',
                    '一步也不想走...', '好沉重...', '没力气...', '歇会儿吧...'
                ]
            }
        };

        // 根据心情选择词库
        const partMoodResponses = moodResponses[partName] || { normal: ['喵？'] };
        let selectedPool;

        if (mood >= 80) {
            selectedPool = partMoodResponses.happy || partMoodResponses.normal;
        } else if (mood <= 30) {
            selectedPool = partMoodResponses.sad || partMoodResponses.normal;
        } else {
            selectedPool = partMoodResponses.normal;
        }

        return getRandomItem(selectedPool);
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
