<template>
  <view class="game-container">
    <!-- 状态栏组件 -->
    <StatusBar 
      :petLevel="growth ? growth.petLevel.value : 1" 
      :coins="growth ? growth.coins.value : 0" 
    />

    <!-- 宠物显示屏组件 -->
    <PetScreen 
      :isMonitoring="monitor.isMonitoring.value"
      :isPetShown="floatWindow.isPetShown.value"
      :petMessage="floatWindow.petMessage.value"
      :mood="growth.mood.value"
      :exp="growth.xpProgress.value"
      :hunger="growth.hunger.value"
      :bond="growth.bond.value"
      :petEmoji="(growth && growth.petDisplay && growth.petDisplay.value) ? growth.petDisplay.value.emoji : '👻'"
      @interact="handlePetInteract"
    />

    <!-- 控制器区域 -->
    <view class="controller-area">
      <!-- Tab 切换组件 -->
      <TabSwitch :currentTab="currentTab" @update:currentTab="currentTab = $event" />

      <!-- 状态面板 -->
      <StatusPanel 
        v-if="currentTab === 'status'"
        :hasFloatPermission="permissions.hasFloatPermission.value"
        :hasUsagePermission="permissions.hasUsagePermission.value"
        :isPetShown="floatWindow.isPetShown.value"
        :isMonitoring="monitor.isMonitoring.value"
        :growthLogs="growthLog.growthLogs.value"
        :achievementProgress="achievements.progress.value.percent"
        @toggle-pet="handleTogglePet"
        @toggle-monitor="handleToggleMonitor"
        @open-history="openHistory"
        @open-achievements="showAchievementModal = true"
      />

      <!-- 配置面板 -->
      <ConfigPanel 
        v-if="currentTab === 'config'"
        :monitorIntervalTime="monitor.monitorIntervalTime.value"
        @open-selector="openSelector"
        @interval-change="handleIntervalChange"
        @open-terminal="terminal.showTerminal.value = true"
        @clear-chat="chat.clearMessages"
        @change-pet-type="handleChangePetType"
        @open-skin-selector="showSkinModal = true"
        @open-skin-market="showMarketModal = true"
        @open-backup="showBackupModal = true"
        @dev-refresh="growth.loadData()"
      />
      
      <!-- 聊天面板 -->
      <ChatPanel
        v-if="currentTab === 'chat'"
        :messages="chat.messages"
        :userInput="chat.userInput"
        :isSending="chat.isSending"
        :quickReplies="chat.quickReplies"
        :petEmoji="(growth && growth.petDisplay && growth.petDisplay.value) ? growth.petDisplay.value.emoji : '👻'"
        @update:userInput="handleUserInputUpdate"
        @send-message="handleSendMessage"
        @quick-reply="handleQuickReply"
      />
      
      <!-- 背包面板 -->
      <BackpackPanel
        v-if="currentTab === 'backpack'"
        :coins="growth ? growth.coins.value : 0"
        @use-item="handleUseItem"
      />
      
      <!-- 日记面板 -->
      <DiaryPanel
        v-if="currentTab === 'diary'"
        :studyMinutes="growth ? growth.todayStudyTime.value : 0"
        :slackMinutes="growth ? growth.todayIdleTime.value : 0"
        :chatCount="userMessageCount"
        :moodStart="50"
        :moodEnd="growth ? growth.mood.value : 50"
        :level="growth ? growth.petLevel.value : 1"
        :events="growthLog.growthLogs.value ? growthLog.growthLogs.value.slice(0, 5).map(l => l.msg) : []"
        :appRanking="monitor.getAppRanking(5)"
        @write-diary="handleWriteDiary"
      />
    </view>

    <!-- 终端弹窗组件 -->
    <TerminalModal 
      :showTerminal="terminal.showTerminal.value"
      :isMonitoring="monitor.isMonitoring.value"
      :logText="terminal.logText.value"
      :scrollTop="terminal.scrollTop.value"
      @close="terminal.showTerminal.value = false"
      @clear-log="terminal.clearLog()"
    />

    <!-- 成就弹窗 -->
    <view class="modal-overlay" v-if="showAchievementModal" @tap="showAchievementModal = false">
      <view class="modal-content achievement-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🏆 成就系统</text>
          <text class="modal-close" @tap="showAchievementModal = false">✕</text>
        </view>
        <AchievementPanel 
          :achievements="achievements.allAchievements.value"
          :progress="achievements.progress.value"
        />
      </view>
    </view>

    <!-- 皮肤选择弹窗 -->
    <view class="modal-overlay" v-if="showSkinModal" @tap="showSkinModal = false">
      <view class="modal-content skin-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🎨 皮肤管理</text>
          <text class="modal-close" @tap="showSkinModal = false">✕</text>
        </view>
        <SkinSelector 
          :currentSkin="skins.currentSkin.value"
          :allSkinsWithStatus="skins.allSkinsWithStatus.value"
          :onlineSkins="skins.onlineSkins.value"
          :downloadProgress="skins.downloadProgress.value"
          :isLoading="skins.isLoading.value"
          :showOnlineSection="false"
          @select="handleSkinSelect"
          @refresh-online="skins.fetchOnlineSkins"
          @download="skins.downloadSkin"
        />
      </view>
    </view>

    <!-- 猜单词小游戏 -->
    <WordGuessGame 
      :visible="showGameModal"
      @close="showGameModal = false"
      @game-end="handleGameEnd"
    />

    <!-- 皮肤商城弹窗 -->
    <view class="modal-overlay" v-if="showMarketModal" @tap="showMarketModal = false">
      <view class="modal-content market-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🛒 皮肤商城</text>
          <text class="modal-close" @tap="showMarketModal = false">✕</text>
        </view>
        <SkinMarket 
          :coins="growth.coins.value"
          :ownedSkins="skins.localSkins.value.map(s => s.id)"
          @purchase="handleSkinPurchase"
        />
      </view>
    </view>

    <!-- 数据备份弹窗 -->
    <view class="modal-overlay" v-if="showBackupModal" @tap="showBackupModal = false">
      <view class="modal-content backup-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">☁️ 数据备份</text>
          <text class="modal-close" @tap="showBackupModal = false">✕</text>
        </view>
        <BackupPanel :cloudSync="cloudSync" />
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * 主页面 - 电子宠物游戏容器
 * 职责:仅作为容器组装组件,所有业务逻辑由 composables 管理
 */
import { onShow } from "@dcloudio/uni-app";
import { logUserAction } from '@/utils/debugLog.js';

// 导入组件(使用 easycom 自动导入,此处为显式声明)
import StatusBar from './components/StatusBar.vue';
import PetScreen from './components/PetScreen.vue';
import TabSwitch from './components/TabSwitch.vue';
import StatusPanel from './components/StatusPanel.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import TerminalModal from './components/TerminalModal.vue';
import ChatPanel from './components/ChatPanel.vue';
import BackpackPanel from './components/BackpackPanel.vue';
import DiaryPanel from './components/DiaryPanel.vue';
import AchievementPanel from './components/AchievementPanel.vue';
import SkinSelector from './components/SkinSelector.vue';
import WordGuessGame from './components/WordGuessGame.vue';
import SkinMarket from './components/SkinMarket.vue';
import BackupPanel from './components/BackupPanel.vue';

// 导入 Composables
import { useGrowth } from './composables/useGrowth.js';
import { useGrowthLog } from './composables/useGrowthLog.js';
import { useAI } from './composables/useAI.js';
import { useChat } from './composables/useChat.js';
import { useFloatWindow } from './composables/useFloatWindow.js';
import { useMonitor } from './composables/useMonitor.js';
import { usePermissions } from './composables/usePermissions.js';
import { useTerminal } from './composables/useTerminal.js';
import { useSkins } from './composables/useSkins.js';
import { useAnimations } from './composables/useAnimations.js';
import { useMemory } from './composables/useMemory.js';
import { useCloudSync } from './composables/useCloudSync.js';
import { 
    getTimeBasedGreeting, 
    shouldShowDailyGreeting, 
    markDailyGreetingShown, 
    savePendingGreeting,
    getAndClearPendingGreeting 
} from './composables/useGreeting.js';
import { useAchievements } from './composables/useAchievements.js';
import { usePetInteraction } from './composables/usePetInteraction.js';
import { ref, computed, watch } from 'vue';

// ========== 1. 初始化 Composables ==========

// 1.1 成长系统
const growth = useGrowth();

// 1.2 成长日志系统
const growthLog = useGrowthLog();

// 1.3 成就系统
const achievements = useAchievements();

// 1.3 AI系统
const ai = useAI();

// 1.4 聊天系统
const chat = useChat();

// 1.5 终端日志系统
const terminal = useTerminal();

// 1.6 权限系统
const permissions = usePermissions();

// 1.7 悬浮窗系统（先创建引用，稍后设置回调）
let floatWindow = null;
let petInteraction = null;

// 先初始化floatWindow（不带手势回调）
floatWindow = useFloatWindow({
    onPermissionDenied: (type) => {
        permissions.requestPermission(type);
    },
    onPetInteraction: () => {
        // 兼容旧版简单点击
        growth.interact();
        growthLog.addGrowthLog("互动 (心情+2, 亲密+1)", 0);
    },
    onGestureEvent: (gestureData) => {
        // [BUG#101 修复] 将手势事件转发给 usePetInteraction 处理
        if (petInteraction && petInteraction.handleFloatMessage) {
            petInteraction.handleFloatMessage(100, gestureData);
        }
    },
    addLog: terminal.addLog
});

// 1.7.1 [BUG#101 修复] 宠物互动系统（集成AI响应）
petInteraction = usePetInteraction({
    floatWindowInstance: floatWindow.floatWinInstance,
    onSendToFloat: (type, msg) => floatWindow.sendMessageToFloat(type, msg),
    addLog: (msg) => growthLog.addGrowthLog(msg, 0)
});

// 1.8 监控系统(集成成长和AI系统)
const monitor = useMonitor({
    useGrowthIntegration: growth,
    useGrowthLogIntegration: growthLog,  // 添加日志集成
    useAIIntegration: ai,
    useChatIntegration: chat,  // 添加聊天集成，消息同步到对话
    sendToFloat: floatWindow.sendMessageToFloat,
    onPermissionDenied: (type) => {
        permissions.requestPermission(type);
    },
    addLog: terminal.addLog
});

// 1.9 皮肤系统
const skins = useSkins({
    growthInstance: growth,
    floatWindowInstance: floatWindow
});

// 1.10 动画系统
const animations = useAnimations({
    floatWindowInstance: floatWindow
});

// 1.11 AI记忆系统
const memory = useMemory();

// 1.12 云同步服务
const cloudSync = useCloudSync();

// ========== 2. 页面状态 ==========

// 当前选中的 Tab
const currentTab = ref('status');

// 弹窗状态
const showAchievementModal = ref(false);
const showSkinModal = ref(false);
const showGameModal = ref(false);
const showMarketModal = ref(false);
const showBackupModal = ref(false);

// 计算今日用户对话次数（只统计今天的消息）
const userMessageCount = computed(() => {
    const msgs = chat.messages.value || [];
    const today = new Date().toDateString();
    const todayMsgs = msgs.filter(m => {
        if (m.role !== 'user') return false;
        const msgDate = new Date(m.timestamp).toDateString();
        return msgDate === today;
    });
    console.log('[DiaryDebug] 今日用户消息:', todayMsgs.length, '总消息:', msgs.length);
    return todayMsgs.length;
});

// ========== 3. 生命周期 ==========

// 页面显示时
onShow(() => {
    logUserAction('页面显示', { 
        isPetShown: floatWindow.isPetShown.value, 
        isMonitoring: monitor.isMonitoring.value 
    });
    
    // 检查权限状态
    permissions.checkPermissions();
    
    // 恢复悬浮窗实例(如果需要)
    floatWindow.reinitInstance();
    
    // 加载成长数据
    growth.loadData();
    
    // 检查是否跨天，重置每日统计
    checkAndResetDailyStats();
    
    // 加载成长日志
    growthLog.loadCachedData();
    
    // 加载聊天历史
    chat.loadMessages();
    
    // 加载成就数据
    achievements.loadData();
    
    // 每日首次打开问候
    checkDailyGreeting();
    
    // 延迟检查成就（等数据加载完成）
    setTimeout(() => checkAchievements(), 500);
});

/**
 * 检查并发送每日问候（逻辑已抽离到 useGreeting.js）
 */
const checkDailyGreeting = () => {
    if (!shouldShowDailyGreeting()) return;
    
    markDailyGreetingShown();
    
    setTimeout(() => {
        const greeting = getTimeBasedGreeting();
        
        // 添加到聊天记录
        chat.addMessage('pet', greeting, { type: 'greeting', emotion: 'happy' });
        
        // 处理悬浮窗
        if (floatWindow.isPetShown.value) {
            floatWindow.sendMessageToFloat(1, greeting);
        } else {
            savePendingGreeting(greeting);
        }
    }, 1500);
};

/**
 * 检查并解锁成就
 */
const checkAchievements = () => {
    // 收集当前统计数据
    const stats = {
        totalStudyTime: growth.totalStudyTime.value,
        todayStudyTime: growth.todayStudyTime.value,
        totalIdleTime: growth.totalIdleTime.value,
        chatCount: userMessageCount.value,
        petLevel: growth.petLevel.value
    };
    
    // 检查并解锁成就
    const newlyUnlocked = achievements.checkAndUnlock(stats);
    
    // 如果有新解锁的成就，显示提示
    if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach(achievement => {
            uni.showToast({
                title: `🏆 解锁: ${achievement.name}`,
                icon: 'none',
                duration: 2500
            });
            
            // 发放奖励
            if (achievement.reward) {
                growth.changeCoins(achievement.reward.coins || 0);
                growth.addXP(achievement.reward.exp || 0);
            }
        });
    }
};

/**
 * 检查是否跨天并重置每日统计
 */
const checkAndResetDailyStats = () => {
    const today = new Date().toDateString();
    const lastResetDate = uni.getStorageSync('last_reset_date') || '';
    
    if (lastResetDate !== today) {
        // 跨天了，重置每日统计
        growth.resetDailyStats();
        uni.setStorageSync('last_reset_date', today);
        
        // 添加日志
        growthLog.addGrowthLog('🌅 新的一天开始了！', 0);
    }
};

// ========== 4. 事件处理器 ==========

/**
 * 切换宠物显示
 */
const handleTogglePet = () => {
    logUserAction('切换宠物显示', { 当前状态: floatWindow.isPetShown.value ? '显示中' : '隐藏' });
    permissions.checkPermissions();
    floatWindow.togglePet(permissions.hasFloatPermission.value);
    
    // [BUG#1 修复] 如果是开启悬浮窗，发送初始消息（问候或默认）
    setTimeout(() => {
        if (floatWindow.isPetShown.value) {
            // 同步当前皮肤到悬浮窗
            const currentSkin = skins.currentSkin.value;
            if (currentSkin && currentSkin.id !== 'default') {
                skins.syncSkinToFloat(currentSkin);
            }
            
            // 检查是否有待发送的问候
            const pending = getAndClearPendingGreeting();
            if (pending) {
                // 有待发送的问候，显示问候
                floatWindow.sendMessageToFloat(1, pending);
            } else {
                // 无待发送问候，显示默认初始消息
                floatWindow.sendMessageToFloat(1, 'WordParasite<br>已寄生...');
            }
        }
    }, 1000);  // 增加延迟确保悬浮窗完全加载
};

/**
 * 抚摸宠物互动
 */
const handlePetInteract = () => {
    logUserAction('抚摸宠物', {});
    
    // 调用growth的interact方法
    const result = growth.interact();
    
    // 显示互动效果
    if (result.mood > 0 || result.bond > 0) {
        growthLog.addGrowthLog(`抚摸了宠物 ❤️ 心情+${result.mood} 亲密+${result.bond}`, result.mood);
        uni.showToast({
            title: `💕 宠物很开心！`,
            icon: 'none'
        });
    }
    
    // 检查成就
    checkAchievements();
};

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

/**
 * 选择皮肤
 */
const handleSkinSelect = (skinId) => {
    const success = skins.applySkin(skinId);
    if (success) {
        // 播放开心动画
        animations.playHappy(2000);
        // 关闭弹窗
        showSkinModal.value = false;
    }
};

/**
 * 购买皮肤（商城）
 */
const handleSkinPurchase = (data) => {
    logUserAction('购买皮肤', { skinId: data.skinId, price: data.price });
    
    // 扣除金币
    if (data.price > 0) {
        growth.changeCoins(-data.price);
    }
    
    // 添加皮肤到本地列表
    skins.addSkin(data.skinData);
    
    // 记录日志
    growthLog.addGrowthLog(`购买皮肤「${data.skinData.name}」`, 0);
    
    // 播放动画
    animations.playHappy(2000);
    
    // 关闭商城弹窗，打开皮肤管理（让用户立即切换新皮肤）
    showMarketModal.value = false;
    
    // 延迟打开皮肤管理，让关闭动画完成
    setTimeout(() => {
        showSkinModal.value = true;
        uni.showToast({ 
            title: `✅ 已购买 ${data.skinData.name}`, 
            icon: 'none',
            duration: 2000
        });
    }, 300);
};

/**
 * 打开成长历史
 */
const openHistory = () => {
    uni.navigateTo({ url: '/pages/log/log-history' });
};

/**
 * 处理用户输入更新
 */
const handleUserInputUpdate = (value) => {
    console.log('[index.vue] handleUserInputUpdate', value);
    if (chat.userInput) {
        chat.userInput.value = value;
    }
};

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
                // 构建聊天历史
                const history = chat.messages.value
                    .filter(m => m.role !== 'system')
                    .map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }));
                
                const reply = await ai.chatWithPet(userMsg, ctx, history);
                return reply;
            } catch (e) {
                return '嗯...让我想想 💭';
            }
        },
        context
    );
    
    // 发送消息后检查成就
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
                // 构建聊天历史
                const history = chat.messages.value
                    .filter(m => m.role !== 'system')
                    .map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    }));
                
                const reply = await ai.chatWithPet(userMsg, ctx, history);
                return reply;
            } catch (e) {
                return '嗯...让我想想 💭';
            }
        },
        context
    );
    
    // 快捷回复后检查成就
    checkAchievements();
};

/**
 * 使用背包物品
 */
const handleUseItem = (data) => {
    logUserAction('使用物品', { itemId: data.itemId, itemName: data.itemName });
    
    // 应用物品效果
    if (data.effect) {
        if (data.effect.mood) growth.changeMood(data.effect.mood);
        if (data.effect.hunger) growth.changeHunger(data.effect.hunger);
        if (data.effect.bond) growth.changeBond(data.effect.bond);
        if (data.effect.exp) growth.addXP(data.effect.exp);
    }
    
    growthLog.addGrowthLog(`使用了 ${data.itemName}`, 0);
    
    // 如果是游戏道具，打开小游戏
    if (data.itemId === 'game_ticket') {
        showGameModal.value = true;
    }
};

/**
 * 小游戏结束处理
 */
const handleGameEnd = (result) => {
    logUserAction('小游戏结束', { score: result.score, correctRate: result.correctRate });
    
    // 发放奖励
    if (result.rewards) {
        growth.addXP(result.rewards.xp);
        growth.changeCoins(result.rewards.coins);
        
        // 增加心情
        if (result.correctRate >= 60) {
            growth.changeMood(10);
        }
        
        // 播放开心动画
        animations.playHappy(3000);
        
        growthLog.addGrowthLog(`小游戏得分 ${result.score}，获得 ${result.rewards.xp}经验 ${result.rewards.coins}金币`, result.rewards.xp);
    }
    
    // 检查成就
    checkAchievements();
};

/**
 * 写日记
 */
const handleWriteDiary = async (data) => {
    logUserAction('写日记', {});
    
    try {
        // 使用 AI 生成日记内容
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
</script>

<style lang="scss">
$bg-color: #1a1a2e;
$bg-main: #1a1a2e;
$card-bg: #16213e;
$text-light: #f1f2f6;

.game-container {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 20px;
  font-family: monospace;
  color: $text-light;
}

/* 控制器区域 */
.controller-area {
  background: $card-bg;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 5px 0 #0f1526;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  background: $bg-main;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.modal-close {
  font-size: 20px;
  color: #747d8c;
  padding: 5px 10px;
}

.achievement-modal {
  max-height: 80vh;
}

.skin-modal {
  max-height: 85vh;
  width: 95%;
  max-width: 420px;
}

.market-modal {
  max-height: 90vh;
  width: 95%;
  max-width: 400px;
}

.backup-modal {
  max-height: 85vh;
  width: 95%;
  max-width: 380px;
  overflow-y: auto;
}
</style>