/**
 * 成就配置列表
 * 定义所有可解锁的成就
 */

export const ACHIEVEMENTS = [
    // ========== 学习类成就 ==========
    {
        id: 'first_study',
        name: '初出茅庐',
        icon: '📖',
        description: '完成第一次学习',
        category: 'study',
        condition: { type: 'total_study', value: 1 },
        reward: { coins: 10, exp: 20 }
    },
    {
        id: 'study_30min',
        name: '认真学习',
        icon: '📚',
        description: '累计学习30分钟',
        category: 'study',
        condition: { type: 'total_study', value: 30 },
        reward: { coins: 30, exp: 50 }
    },
    {
        id: 'study_1hour',
        name: '勤奋学者',
        icon: '🎓',
        description: '累计学习1小时',
        category: 'study',
        condition: { type: 'total_study', value: 60 },
        reward: { coins: 50, exp: 100 }
    },
    {
        id: 'study_5hour',
        name: '学霸之路',
        icon: '🏆',
        description: '累计学习5小时',
        category: 'study',
        condition: { type: 'total_study', value: 300 },
        reward: { coins: 100, exp: 200 }
    },
    {
        id: 'study_daily_1hour',
        name: '今日之星',
        icon: '⭐',
        description: '单日学习超过1小时',
        category: 'study',
        condition: { type: 'daily_study', value: 60 },
        reward: { coins: 40, exp: 80 }
    },

    // ========== 摸鱼类成就 ==========
    {
        id: 'slacker_1hour',
        name: '摸鱼新手',
        icon: '🐟',
        description: '累计摸鱼1小时',
        category: 'slack',
        condition: { type: 'total_idle', value: 60 },
        reward: { coins: 5, exp: 10 }
    },
    {
        id: 'slacker_master',
        name: '摸鱼大师',
        icon: '🎣',
        description: '累计摸鱼5小时',
        category: 'slack',
        condition: { type: 'total_idle', value: 300 },
        reward: { coins: 10, exp: 20 }
    },
    {
        id: 'reformed',
        name: '浪子回头',
        icon: '🌟',
        description: '摸鱼后学习超过30分钟',
        category: 'slack',
        condition: { type: 'reform', value: 30 },
        reward: { coins: 50, exp: 100 }
    },

    // ========== 互动类成就 ==========
    {
        id: 'first_chat',
        name: '话痨开端',
        icon: '💬',
        description: '与宠物对话1次',
        category: 'interact',
        condition: { type: 'chat_count', value: 1 },
        reward: { coins: 5, exp: 10 }
    },
    {
        id: 'chat_10',
        name: '健谈者',
        icon: '🗣️',
        description: '与宠物对话10次',
        category: 'interact',
        condition: { type: 'chat_count', value: 10 },
        reward: { coins: 20, exp: 40 }
    },
    {
        id: 'chat_50',
        name: '话唠王',
        icon: '👑',
        description: '与宠物对话50次',
        category: 'interact',
        condition: { type: 'chat_count', value: 50 },
        reward: { coins: 50, exp: 100 }
    },
    {
        id: 'pet_level_5',
        name: '成长伙伴',
        icon: '🐣',
        description: '宠物达到5级',
        category: 'interact',
        condition: { type: 'pet_level', value: 5 },
        reward: { coins: 30, exp: 60 }
    },
    {
        id: 'pet_level_10',
        name: '亲密无间',
        icon: '💕',
        description: '宠物达到10级',
        category: 'interact',
        condition: { type: 'pet_level', value: 10 },
        reward: { coins: 80, exp: 150 }
    }
];

/**
 * 获取成就分类
 */
export const CATEGORIES = {
    study: { name: '学习类', icon: '📚' },
    slack: { name: '摸鱼类', icon: '🐟' },
    interact: { name: '互动类', icon: '💬' }
};

/**
 * 根据ID获取成就
 */
export function getAchievementById(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * 获取某分类的所有成就
 */
export function getAchievementsByCategory(category) {
    return ACHIEVEMENTS.filter(a => a.category === category);
}
