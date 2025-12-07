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
        @open-achievements="openModal('achievement')"
      />

      <!-- 配置面板 -->
      <ConfigPanel 
        v-if="currentTab === 'config'"
        :monitorIntervalTime="monitor.monitorIntervalTime.value"
        :randomChatEnabled="petInteraction.randomChat.enabled.value"
        :randomChatHistoryCount="petInteraction.randomChat.chatHistory.value.length"
        @open-selector="openSelector"
        @interval-change="handleIntervalChange"
        @toggle-random-chat="handleToggleRandomChat"
        @open-random-history="openModal('randomHistory')"
        @open-terminal="terminal.showTerminal.value = true"
        @clear-chat="chat.clearMessages"
        @change-pet-type="handleChangePetType"
        @open-skin-selector="openModal('skin')"
        @open-skin-market="openModal('market')"
        @open-backup="openModal('backup')"
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
    <view class="modal-overlay" v-if="showAchievementModal" @tap="closeModal('achievement')">
      <view class="modal-content achievement-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🏆 成就系统</text>
          <text class="modal-close" @tap="closeModal('achievement')">✕</text>
        </view>
        <AchievementPanel 
          :achievements="achievements.allAchievements.value"
          :progress="achievements.progress.value"
        />
      </view>
    </view>

    <!-- 皮肤选择弹窗 -->
    <view class="modal-overlay" v-if="showSkinModal" @tap="closeModal('skin')">
      <view class="modal-content skin-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🎨 皮肤管理</text>
          <text class="modal-close" @tap="closeModal('skin')">✕</text>
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
      @close="closeModal('game')"
      @game-end="handleGameEnd"
    />

    <!-- 皮肤商城弹窗 -->
    <view class="modal-overlay" v-if="showMarketModal" @tap="closeModal('market')">
      <view class="modal-content market-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">🛒 皮肤商城</text>
          <text class="modal-close" @tap="closeModal('market')">✕</text>
        </view>
        <SkinMarket 
          :coins="growth.coins.value"
          :ownedSkins="skins.localSkins.value.map(s => s.id)"
          @purchase="handleSkinPurchase"
        />
      </view>
    </view>

    <!-- 数据备份弹窗 -->
    <view class="modal-overlay" v-if="showBackupModal" @tap="closeModal('backup')">
      <view class="modal-content backup-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">☁️ 数据备份</text>
          <text class="modal-close" @tap="closeModal('backup')">✕</text>
        </view>
        <BackupPanel :cloudSync="cloudSync" />
      </view>
    </view>

    <!-- 随机互动历史弹窗 -->
    <view class="modal-overlay" v-if="showRandomHistoryModal" @tap="closeModal('randomHistory')">
      <view class="modal-content history-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">📜 互动历史</text>
          <text class="modal-close" @tap="closeModal('randomHistory')">✕</text>
        </view>
        <RandomChatHistory 
          :history="petInteraction.randomChat.chatHistory.value"
          @clear="handleClearRandomHistory"
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
import SkinSelector from './components/SkinSelector.vue';
import WordGuessGame from './components/WordGuessGame.vue';
import SkinMarket from './components/SkinMarket.vue';
import BackupPanel from './components/BackupPanel.vue';
import RandomChatHistory from './components/RandomChatHistory.vue';

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
import { usePageLifecycle } from './composables/usePageLifecycle.js';
import { useChatHandlers } from './composables/useChatHandlers.js';
import { useIndexState } from './composables/useIndexState.js';
import { useIndexHandlers } from './composables/useIndexHandlers.js';
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
// [BUG#NEW-1 修复] 传入共享的 growth 实例，避免数据不一致
petInteraction = usePetInteraction({
    floatWindowInstance: floatWindow.floatWinInstance,
    growthInstance: growth,  // 注入共享实例
    useChatIntegration: chat,  // [Phase 4] 随机互动消息同步到聊天面板
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

// ========== 2. 页面状态（使用 useIndexState）==========
const indexState = useIndexState(chat);
const { currentTab, modals, openModal, closeModal } = indexState;

// 兼容性别名
const showAchievementModal = computed(() => modals.achievement);
const showSkinModal = computed(() => modals.skin);
const showGameModal = computed(() => modals.game);
const showMarketModal = computed(() => modals.market);
const showBackupModal = computed(() => modals.backup);
const showRandomHistoryModal = computed(() => modals.randomHistory);
const userMessageCount = indexState.userMessageCount;

// ========== 2.1 页面生命周期 ==========
const lifecycle = usePageLifecycle({
    permissions,
    floatWindow,
    growth,
    growthLog,
    chat,
    achievements,
    getChatCount: () => userMessageCount.value
});

// ========== 2.2 事件处理器（使用 useIndexHandlers）==========
const handlers = useIndexHandlers({
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
    indexState,
    petInteraction
});

// 聊天事件处理（保留兼容）
const chatHandlers = useChatHandlers({
    chat,
    ai,
    growth,
    onCheckAchievements: () => lifecycle.checkAchievements()
});

// ========== 3. 生命周期 ==========
onShow(() => lifecycle.initializePage());

// 兼容性别名
const checkAchievements = () => lifecycle.checkAchievements();

// ========== 4. 事件处理器（委托给 handlers/chatHandlers）==========

// 宠物交互
const handleTogglePet = handlers.handleTogglePet;
const handlePetInteract = handlers.handlePetInteract;

// 监控控制
const handleToggleMonitor = handlers.handleToggleMonitor;
const handleIntervalChange = handlers.handleIntervalChange;

// 随机互动控制
// 随机互动控制
const handleToggleRandomChat = handlers.handleToggleRandomChat;
const handleClearRandomHistory = handlers.handleClearRandomHistory;

// 导航
const openSelector = handlers.openSelector;
const openHistory = handlers.openHistory;
const handleChangePetType = handlers.handleChangePetType;

// 皮肤/游戏
const handleSkinSelect = handlers.handleSkinSelect;
const handleSkinPurchase = handlers.handleSkinPurchase;
const handleUseItem = handlers.handleUseItem;
const handleGameEnd = handlers.handleGameEnd;

// 聊天（委托给 chatHandlers）
const handleUserInputUpdate = chatHandlers.handleUserInputUpdate;
const handleSendMessage = chatHandlers.handleSendMessage;
const handleQuickReply = chatHandlers.handleQuickReply;

// 日记
const handleWriteDiary = handlers.handleWriteDiary;
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