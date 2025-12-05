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

// 导入 Composables
import { useGrowth } from './composables/useGrowth.js';
import { useGrowthLog } from './composables/useGrowthLog.js';
import { useAI } from './composables/useAI.js';
import { useChat } from './composables/useChat.js';
import { useFloatWindow } from './composables/useFloatWindow.js';
import { useMonitor } from './composables/useMonitor.js';
import { usePermissions } from './composables/usePermissions.js';
import { useTerminal } from './composables/useTerminal.js';
import { 
    getTimeBasedGreeting, 
    shouldShowDailyGreeting, 
    markDailyGreetingShown, 
    savePendingGreeting,
    getAndClearPendingGreeting 
} from './composables/useGreeting.js';
import { useAchievements } from './composables/useAchievements.js';
import { ref, computed } from 'vue';

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

// 1.7 悬浮窗系统
const floatWindow = useFloatWindow({
    onPermissionDenied: (type) => {
        permissions.requestPermission(type);
    },
    onPetInteraction: () => {
        // 宠物互动逻辑 (interact方法会增加心情+2, 亲密度+1)
        growth.interact();
        // 记录成长日志 - val设为0避免末尾显示重复数字
        growthLog.addGrowthLog("互动 (心情+2, 亲密+1)", 0);
    },
    addLog: terminal.addLog
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

// ========== 2. 页面状态 ==========

// 当前选中的 Tab
const currentTab = ref('status');

// 成就弹窗显示状态
const showAchievementModal = ref(false);

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
    
    // 如果是开启悬浮窗，检查是否有待发送的问候
    setTimeout(() => {
        if (floatWindow.isPetShown.value) {
            const pending = getAndClearPendingGreeting();
            if (pending) {
                floatWindow.sendMessageToFloat(1, pending);
            }
        }
    }, 500);
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
</style>