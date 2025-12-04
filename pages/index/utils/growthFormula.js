/**
 * 宠物成长系统 - 数值计算公式
 */

/**
 * 获取升级所需经验值
 * @param {number} level - 当前等级
 * @returns {number} 升级所需经验
 */
export function getRequiredXP(level) {
    return Math.floor(50 * Math.pow(level, 1.5));
}

/**
 * 检查是否可以升级
 * @param {number} currentXP - 当前经验值
 * @param {number} level - 当前等级
 * @returns {boolean} 是否可以升级
 */
export function canLevelUp(currentXP, level) {
    return currentXP >= getRequiredXP(level);
}

/**
 * 执行升级，返回新等级和剩余经验
 * @param {number} currentXP - 当前经验值
 * @param {number} level - 当前等级
 * @returns {{newLevel: number, remainingXP: number}} 新等级和剩余经验
 */
export function levelUp(currentXP, level) {
    let newLevel = level;
    let remainingXP = currentXP;

    // 支持连续升级（如果经验足够多）
    while (canLevelUp(remainingXP, newLevel) && newLevel < 99) {
        remainingXP -= getRequiredXP(newLevel);
        newLevel++;
    }

    return { newLevel, remainingXP };
}

/**
 * 计算学习奖励
 * @param {number} durationMinutes - 学习时长（分钟）
 * @returns {{xp: number, coins: number, mood: number}} 奖励数值
 */
export function calculateStudyReward(durationMinutes) {
    let xp = 0;
    let coins = 0;
    let mood = 0;

    if (durationMinutes >= 60) {
        xp = 150;
        coins = 100;
        mood = 20;
    } else if (durationMinutes >= 30) {
        xp = 60;
        coins = 30;
        mood = 15;
    } else if (durationMinutes >= 15) {
        xp = 30;
        coins = 15;
        mood = 10;
    } else if (durationMinutes >= 5) {
        xp = 10;
        coins = 5;
        mood = 5;
    }

    return { xp, coins, mood };
}

/**
 * 计算摸鱼惩罚
 * @param {number} durationMinutes - 摸鱼时长（分钟）
 * @returns {{mood: number, coins: number, hunger: number}} 惩罚数值
 */
export function calculateIdlePenalty(durationMinutes) {
    let mood = 0;
    let coins = 0;
    let hunger = 0;

    if (durationMinutes >= 180) {
        mood = -50;
        coins = -50;
        hunger = -50;
    } else if (durationMinutes >= 60) {
        mood = -30;
        coins = -20;
        hunger = -20;
    } else if (durationMinutes >= 30) {
        mood = -20;
        hunger = -10;
    } else if (durationMinutes >= 10) {
        mood = -10;
    }

    return { mood, coins, hunger };
}

/**
 * 自然衰减（每小时）
 * @param {number} mood - 当前心情
 * @param {number} hunger - 当前饥饿度
 * @returns {{mood: number, hunger: number}} 衰减后的数值
 */
export function applyTimeDecay(mood, hunger) {
    // 饥饿度每小时 -5
    const newHunger = Math.max(0, hunger - 5);

    // 心情值回归中位值（50）
    let newMood = mood;
    if (mood > 50) {
        newMood = Math.max(50, mood - 2);
    }

    return { mood: newMood, hunger: newHunger };
}

/**
 * 限制数值范围
 * @param {number} value - 当前值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}
