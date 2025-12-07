/**
 * 事件处理器集合 Composable
 * 职责: 统一管理 index.vue 的所有事件处理函数
 * 
 * 分类:
 * - 宠物交互
 * - 监控控制
 * - 聊天消息
 * - 皮肤/游戏
 * - 导航跳转
 */
import { debugLog } from '@/utils/debugLog.js';
import {
    getAndClearPendingGreeting
} from './useGreeting.js';

/**
 * 用户操作日志
 */
const logUserAction = (action, data = {}) => {
    debugLog(`[用户操作] ${action}`, data);
};

/**
 * 统一事件处理器
 * @param {Object} deps - 依赖的composable实例
 */
export function useIndexHandlers(deps) {
    const {
        growth,
        growthLog,
        chat,
        ai,
        monitor,
        floatWindow,
        permissions,
        terminal,
        skins,
        animations,
        achievements,
        memory,
        cloudSync,
        indexState,  // useIndexState实例
        petInteraction // 宠物互动实例
    } = deps;

    // ========== 宠物交互 ==========

    /**
     * 抚摸宠物互动
     */
    const handlePetInteract = () => {
        logUserAction('抚摸宠物', {});

        const result = growth.interact();

        if (result.mood > 0 || result.bond > 0) {
            growthLog.addGrowthLog(`抚摸了宠物 ❤️ 心情+${result.mood} 亲密+${result.bond}`, result.mood);
            uni.showToast({ title: `💕 宠物很开心！`, icon: 'none' });
        }

        checkAchievements();
    };

    /**
     * 切换宠物显示
     */
    const handleTogglePet = () => {
        logUserAction('切换宠物显示', { 当前状态: floatWindow.isPetShown.value ? '显示中' : '隐藏' });
        permissions.checkPermissions();
        floatWindow.togglePet(permissions.hasFloatPermission.value);

        setTimeout(() => {
            if (floatWindow.isPetShown.value) {
                // 同步当前皮肤到悬浮窗
                if (skins && skins.currentSkin && skins.currentSkin.value) {
                    const currentSkin = skins.currentSkin.value;
                    if (currentSkin.id !== 'default') {
                        skins.syncSkinToFloat(currentSkin);
                    }
                }

                // 检查是否有待发送的问候
                const pending = getAndClearPendingGreeting();
                if (pending) {
                    floatWindow.sendMessageToFloat(1, pending);
                }
            }
        }, 500);
    };

    // ========== 监控与智能控制 ==========

    /**
     * 切换监控状态
     */
    const handleToggleMonitor = () => {
        logUserAction('切换监控状态', { 当前状态: monitor.isMonitoring.value ? '监控中' : '停止' });
        permissions.checkPermissions();
        monitor.toggleMonitor(permissions.hasUsagePermission.value);
    };

    /**
     * 监控间隔变更
     */
    const handleIntervalChange = (value) => {
        monitor.updateMonitorInterval(value);
    };

    /**
     * 切换随机互动功能
     */
    const handleToggleRandomChat = (enabled) => {
        if (!petInteraction || !petInteraction.randomChat) return;

        if (enabled) {
            petInteraction.randomChat.enable();
        } else {
            petInteraction.randomChat.disable();
        }

        uni.showToast({
            title: enabled ? '随机互动已开启' : '随机互动已关闭',
            icon: 'none'
        });
    };

    /**
     * 清空随机互动历史
     */
    const handleClearRandomHistory = () => {
        if (!petInteraction || !petInteraction.randomChat) return;
        petInteraction.randomChat.clearHistory();
    };

    // ========== 聊天消息 ==========

    /**
     * 发送消息
     */
    const handleSendMessage = async (content) => {
        logUserAction('发送消息', { 内容: content.substring(0, 30) });

        const context = {
            level: growth.petLevel.value,
            mood: growth.mood.value,
            todayStudyTime: growth.todayStudyTime.value,
            todayIdleTime: growth.todayIdleTime.value
        };

        await chat.sendMessage(
            content,
            async (userMsg, ctx) => {
                try {
                    const history = chat.messages.value
                        .filter(m => m.role !== 'system')
                        .map(m => ({
                            role: m.role === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }));

                    return await ai.chatWithPet(userMsg, ctx, history);
                } catch (e) {
                    return '嗯...让我想想 💭';
                }
            },
            context
        );

        // 添加到AI记忆
        if (memory) {
            memory.addMemory('user', content);
        }

        checkAchievements();
    };

    /**
     * 快捷回复
     */
    const handleQuickReply = async (replyId) => {
        logUserAction('点击快捷回复', { replyId });

        const context = {
            level: growth.petLevel.value,
            mood: growth.mood.value,
            todayStudyTime: growth.todayStudyTime.value,
            todayIdleTime: growth.todayIdleTime.value
        };

        chat.sendQuickReply(
            replyId,
            async (userMsg, ctx) => {
                try {
                    const history = chat.messages.value
                        .filter(m => m.role !== 'system')
                        .map(m => ({
                            role: m.role === 'user' ? 'user' : 'assistant',
                            content: m.content
                        }));

                    return await ai.chatWithPet(userMsg, ctx, history);
                } catch (e) {
                    return '嗯...让我想想 💭';
                }
            },
            context
        );

        checkAchievements();
    };

    /**
     * 处理用户输入更新
     */
    const handleUserInputUpdate = (value) => {
        if (chat.userInput) {
            chat.userInput.value = value;
        }
    };

    // ========== 皮肤/游戏 ==========

    /**
     * 选择皮肤
     */
    const handleSkinSelect = (skinId) => {
        const success = skins.applySkin(skinId);
        if (success) {
            animations.playHappy(2000);
            indexState.closeModal('skin');
        }
    };

    /**
     * 购买皮肤（商城）
     */
    const handleSkinPurchase = (data) => {
        logUserAction('购买皮肤', { skinId: data.skinId, price: data.price });

        if (data.price > 0) {
            growth.changeCoins(-data.price);
        }

        growthLog.addGrowthLog(`购买皮肤「${data.skinData.name}」`, 0);
        animations.playHappy(2000);
    };

    /**
     * 使用背包物品
     */
    const handleUseItem = (data) => {
        logUserAction('使用物品', { itemId: data.itemId, itemName: data.itemName });

        if (data.effect) {
            if (data.effect.mood) growth.changeMood(data.effect.mood);
            if (data.effect.hunger) growth.changeHunger(data.effect.hunger);
            if (data.effect.bond) growth.changeBond(data.effect.bond);
            if (data.effect.exp) growth.addXP(data.effect.exp);
        }

        growthLog.addGrowthLog(`使用了 ${data.itemName}`, 0);

        if (data.itemId === 'game_ticket') {
            indexState.openModal('game');
        }
    };

    /**
     * 小游戏结束处理
     */
    const handleGameEnd = (result) => {
        logUserAction('小游戏结束', { score: result.score, correctRate: result.correctRate });

        if (result.rewards) {
            growth.addXP(result.rewards.xp);
            growth.changeCoins(result.rewards.coins);

            if (result.correctRate >= 60) {
                growth.changeMood(10);
            }

            animations.playHappy(3000);
            growthLog.addGrowthLog(`小游戏得分 ${result.score}，获得 ${result.rewards.xp}经验 ${result.rewards.coins}金币`, result.rewards.xp);
        }

        checkAchievements();
    };

    // ========== 导航跳转 ==========

    /**
     * 打开成长历史
     */
    const openHistory = () => {
        uni.navigateTo({ url: '/pages/log/log-history' });
    };

    /**
     * 打开应用选择器
     */
    const openSelector = (mode) => {
        uni.showLoading({ title: '准备中...', mask: true });
        setTimeout(() => {
            uni.hideLoading();
            uni.navigateTo({
                url: `/pages/config/app-selector?mode=${mode}`,
                fail: () => uni.hideLoading()
            });
        }, 100);
    };

    /**
     * 切换宠物类型
     */
    const handleChangePetType = (petTypeId) => {
        if (growth && growth.changePetType) {
            growth.changePetType(petTypeId);
        }
    };

    // ========== 日记功能 ==========

    /**
     * 写日记
     */
    const handleWriteDiary = async (data) => {
        logUserAction('写日记', {});

        try {
            const diaryContent = await ai.generateDiary(data.prompt);
            if (data.callback) {
                data.callback(diaryContent);
            }
        } catch (e) {
            console.error('生成日记失败:', e);
            if (data.onError) {
                data.onError();
            }
        }
    };

    // ========== 成就检查 ==========

    /**
     * 检查成就
     */
    const checkAchievements = () => {
        if (achievements && achievements.checkAll) {
            const newlyUnlocked = achievements.checkAll({
                level: growth.petLevel.value,
                totalStudyTime: growth.totalStudyTime.value,
                totalIdleTime: growth.totalIdleTime.value,
                chatCount: indexState.userMessageCount.value || 0,
                mood: growth.mood.value,
                bond: growth.bond.value,
                coins: growth.coins.value
            });

            if (newlyUnlocked && newlyUnlocked.length > 0) {
                newlyUnlocked.forEach(ach => {
                    uni.showToast({ title: `🏆 解锁成就: ${ach.name}`, icon: 'none', duration: 2500 });
                    growthLog.addGrowthLog(`🏆 解锁成就「${ach.name}」`, 0);
                });
            }
        }
    };

    // ========== 返回所有处理器 ==========
    return {
        // 宠物交互
        handlePetInteract,
        handleTogglePet,

        // 监控与智能控制
        handleToggleMonitor,
        handleIntervalChange,
        handleToggleRandomChat,
        handleClearRandomHistory,

        // 聊天消息
        handleSendMessage,
        handleQuickReply,
        handleUserInputUpdate,

        // 皮肤/游戏
        handleSkinSelect,
        handleSkinPurchase,
        handleUseItem,
        handleGameEnd,

        // 导航跳转
        openHistory,
        openSelector,
        handleChangePetType,

        // 日记功能
        handleWriteDiary,

        // 成就检查
        checkAchievements
    };
}
