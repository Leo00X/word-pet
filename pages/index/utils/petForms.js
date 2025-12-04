/**
 * 宠物形态管理
 * 定义不同宠物类型和形态判定逻辑
 */

// 宠物类型配置
export const PET_TYPES = {
    GHOST: {
        id: 'ghost',
        name: '幽灵',
        emoji: '👻',
        color: '#00d9ff',
        description: '神秘的电子幽灵，漂浮在数据海洋中'
    },
    DOG: {
        id: 'dog',
        name: '中华田园犬',
        emoji: '🐕',
        color: '#ffaa00',
        description: '忠诚的守护犬，陪伴你的学习之旅'
    },
    COCKATIEL: {
        id: 'cockatiel',
        name: '玄凤鹦鹉',
        emoji: '🦜',
        color: '#ffd700',
        description: '活泼的小鸟，用歌声督促你学习'
    },
    MONK_PARAKEET: {
        id: 'monk_parakeet',
        name: '和尚鹦鹉',
        emoji: '🦜',
        color: '#00ff88',
        description: '聪明的鹦鹉，与你对话的好伙伴'
    }
};

// 形态状态（基于数值）
export const PET_STATES = {
    EGG: {
        id: 'egg',
        name: '蛋形态',
        levelRange: [1, 5],
        emoji: '🥚',
        filter: 'brightness(100%)'
    },
    TEEN: {
        id: 'teen',
        name: '幼年',
        levelRange: [6, 15],
        emoji: '🐣',
        filter: 'brightness(110%) saturate(120%)'
    },
    ADULT: {
        id: 'adult',
        name: '成年',
        levelRange: [16, 99],
        emoji: '✨',
        filter: 'brightness(100%) saturate(100%)'
    },
    EVIL: {
        id: 'evil',
        name: '邪恶形态',
        condition: 'mood < 20',
        emoji: '😈',
        filter: 'hue-rotate(320deg) saturate(150%) brightness(90%)',
        color: '#ff3366'
    },
    ANGEL: {
        id: 'angel',
        name: '天使形态',
        condition: 'mood > 80',
        emoji: '😇',
        filter: 'hue-rotate(40deg) brightness(130%) saturate(120%)',
        color: '#ffd700'
    },
    CYBER: {
        id: 'cyber',
        name: '机械形态',
        condition: 'bond == 100',
        emoji: '🤖',
        filter: 'hue-rotate(180deg) saturate(200%) contrast(120%)',
        color: '#00ffff'
    }
};

/**
 * 根据等级判定基础形态
 * @param {number} level - 宠物等级
 * @returns {Object} 形态对象
 */
export function getFormByLevel(level) {
    if (level >= 1 && level <= 5) return PET_STATES.EGG;
    if (level >= 6 && level <= 15) return PET_STATES.TEEN;
    return PET_STATES.ADULT;
}

/**
 * 根据数值判定特殊形态（优先级高于基础形态）
 * @param {number} level - 宠物等级
 * @param {number} mood - 心情值
 * @param {number} bond - 亲密度
 * @returns {Object} 形态对象
 */
export function getPetForm(level, mood, bond) {
    // 特殊形态优先（等级16+才能触发）
    if (level >= 16) {
        if (bond >= 100) return PET_STATES.CYBER;
        if (mood > 80) return PET_STATES.ANGEL;
        if (mood < 20) return PET_STATES.EVIL;
    }

    // 基础形态
    return getFormByLevel(level);
}

/**
 * 获取宠物显示配置（合并类型和形态）
 * @param {string} petType - 宠物类型 ID
 * @param {number} level - 等级
 * @param {number} mood - 心情
 * @param {number} bond - 亲密度
 * @returns {Object} 完整显示配置
 */
export function getPetDisplay(petType, level, mood, bond) {
    const type = Object.values(PET_TYPES).find(t => t.id === petType) || PET_TYPES.GHOST;
    const form = getPetForm(level, mood, bond);

    return {
        type,
        form,
        emoji: form.id === 'egg' ? form.emoji : type.emoji, // 蛋形态显示蛋，其他显示宠物类型
        color: form.color || type.color,
        filter: form.filter,
        name: `${form.name} ${type.name}`,
        description: type.description
    };
}

/**
 * 获取可用宠物列表
 * @returns {Array} 宠物类型数组
 */
export function getAvailablePets() {
    return Object.values(PET_TYPES);
}
