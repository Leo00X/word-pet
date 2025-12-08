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
      @interact="handlers.handlePetInteract"
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
        @toggle-pet="handlers.handleTogglePet"
        @toggle-monitor="handlers.handleToggleMonitor"
        @open-history="handlers.openHistory"
        @open-achievements="openModal('achievement')"
      />

      <!-- 配置面板 -->
      <ConfigPanel 
        v-if="currentTab === 'config'"
        :monitorIntervalTime="monitor.monitorIntervalTime.value"
        :randomChatEnabled="petInteraction.randomChat.enabled.value"
        :randomChatHistoryCount="petInteraction.randomChat.chatHistory.value.length"
        :partedModeEnabled="partedModeEnabled"
        :petRenderMode="floatWindow.petHtmlVersion.value"
        :currentLive2dModel="currentLive2dModel"
        @open-selector="handlers.openSelector"
        @interval-change="handlers.handleIntervalChange"
        @toggle-random-chat="handlers.handleToggleRandomChat"
        @toggle-parted-mode="(val) => { partedModeEnabled = val; floatWindow.setPetVersion(val ? 'v2' : 'v1') }"
        @change-render-mode="(mode) => { floatWindow.setPetVersion(mode); if(mode !== 'v1') partedModeEnabled = (mode === 'v2') }"
        @change-live2d-model="handleChangeLive2dModel"
        @open-random-history="openModal('randomHistory')"
        @open-terminal="terminal.showTerminal.value = true"
        @clear-chat="chat.clearMessages"
        @change-pet-type="handlers.handleChangePetType"
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
        @use-item="handlers.handleUseItem"
      />
      
      <!-- 日记面板 -->
      <DiaryPanel
        v-if="currentTab === 'diary'"
        :studyMinutes="growth ? growth.todayStudyTime.value : 0"
        :slackMinutes="growth ? growth.todayIdleTime.value : 0"
        :chatCount="userMessageCount"
        :moodStart="growth ? growth.todayMoodStart.value : 50"
        :moodEnd="growth ? growth.mood.value : 50"
        :level="growth ? growth.petLevel.value : 1"
        :events="growthLog.growthLogs.value ? growthLog.growthLogs.value.slice(0, 5).map(l => l.msg) : []"
        :appRanking="monitor.getAppRanking(5)"
        @write-diary="handlers.handleWriteDiary"
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
          @select="handlers.handleSkinSelect"
          @refresh-online="skins.fetchOnlineSkins"
          @download="skins.downloadSkin"
        />
      </view>
    </view>

    <!-- 猜单词小游戏 -->
    <WordGuessGame 
      :visible="showGameModal"
      @close="closeModal('game')"
      @game-end="handlers.handleGameEnd"
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
          @purchase="handlers.handleSkinPurchase"
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
          @clear="handlers.handleClearRandomHistory"
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
import { onShow, onHide } from "@dcloudio/uni-app";
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
import { usePersonality } from './composables/usePersonality.js';
import { useReflection } from './composables/useReflection.js';
import { useVectorMemory } from './composables/useVectorMemory.js';
import { usePageLifecycle } from './composables/usePageLifecycle.js';
import { useChatHandlers } from './composables/useChatHandlers.js';
import { useIndexState } from './composables/useIndexState.js';
import { useIndexHandlers } from './composables/useIndexHandlers.js';
import { ref, computed, watch } from 'vue';

// ========== 1. 初始化 Composables ==========
const growth = useGrowth();
const growthLog = useGrowthLog();
const achievements = useAchievements();
const personality = usePersonality();  // HCDS Phase 1
const reflection = useReflection();    // HCDS Phase 3
const vectorMemory = useVectorMemory(); // HCDS Phase 5
const ai = useAI();
const chat = useChat();
const terminal = useTerminal();
const permissions = usePermissions();

// 悬浮窗和宠物互动
let floatWindow = null;
let petInteraction = null;

floatWindow = useFloatWindow({
    onPermissionDenied: (type) => permissions.requestPermission(type),
    onPetInteraction: () => {
        growth.interact();
        growthLog.addGrowthLog("互动 (心情+2, 亲密+1)", 0);
    },
    onGestureEvent: (gestureData) => {
        if (petInteraction?.handleFloatMessage) {
            petInteraction.handleFloatMessage(100, gestureData);
        }
    },
    addLog: terminal.addLog
});

petInteraction = usePetInteraction({
    floatWindowInstance: floatWindow.floatWinInstance,
    growthInstance: growth,
    useChatIntegration: chat,
    onSendToFloat: (type, msg) => floatWindow.sendMessageToFloat(type, msg),
    addLog: (msg) => growthLog.addGrowthLog(msg, 0)
});

// 监控系统
const monitor = useMonitor({
    useGrowthIntegration: growth,
    useGrowthLogIntegration: growthLog,
    useAIIntegration: ai,
    useChatIntegration: chat,  // 添加聊天集成，消息同步到对话
    sendToFloat: floatWindow.sendMessageToFloat,
    onPermissionDenied: (type) => {
        permissions.requestPermission(type);
    },
    addLog: terminal.addLog
});

// 周边系统
const skins = useSkins({ growthInstance: growth, floatWindowInstance: floatWindow });
const animations = useAnimations({ floatWindowInstance: floatWindow });
const memory = useMemory();
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

// 分层宠物模式状态
const partedModeEnabled = ref(uni.getStorageSync('pet_parted_mode') || false);

// Live2D 模型选择
const currentLive2dModel = ref(uni.getStorageSync('live2d_model') || 'hiyori');

// 切换 Live2D 模型
const handleChangeLive2dModel = async (modelName) => {
    currentLive2dModel.value = modelName;
    uni.setStorageSync('live2d_model', modelName);
    
    // 如果当前是 Live2D 模式，发送新模型数据
    if (floatWindow.petHtmlVersion.value === 'live2d' && floatWindow.floatWinInstance.value) {
        uni.showLoading({ title: '加载模型...' });
        const { useLive2dLoader } = await import('./composables/useLive2dLoader.js');
        const loader = useLive2dLoader();
        await loader.sendModelToFloatWindow(floatWindow.floatWinInstance.value, modelName);
        uni.hideLoading();
    }
};

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

// 聊天事件处理（HCDS 集成）
const chatHandlers = useChatHandlers({
    chat,
    ai,
    growth,
    personality,     // HCDS Phase 1
    memory,          // HCDS Phase 2
    reflection,      // HCDS Phase 3
    vectorMemory,    // HCDS Phase 5
    onCheckAchievements: () => lifecycle.checkAchievements()
});

// ========== 3. 生命周期 ==========
const wasPetShown = ref(false);

onShow(() => {
    lifecycle.initializePage();
    // 恢复悬浮窗状态（如果之前是被我们隐藏的）
    if (wasPetShown.value && floatWindow) {
        floatWindow.reinitInstance(); // 确保实例存在
        floatWindow.showFloatWindow(true);
        wasPetShown.value = false;
    }
});

onHide(() => {
    // [BUG#111] 不再自动隐藏悬浮窗
    // 悬浮窗应独立于主页面存在，返回桌面时保持显示
});

// 兼容性别名（lifecycle 需要在模板中使用）
const checkAchievements = () => lifecycle.checkAchievements();

// ========== 4. 事件处理器 ==========
// 注意：大部分处理器直接在 template 中使用 handlers.xxx 和 chatHandlers.xxx
// 以下仅保留需要特殊处理或兼容性的别名

// 聊天相关（chatHandlers 需要拆开使用）
const handleUserInputUpdate = chatHandlers.handleUserInputUpdate;
const handleSendMessage = chatHandlers.handleSendMessage;
const handleQuickReply = chatHandlers.handleQuickReply;
</script>

<style lang="scss">
.game-container {
  background: linear-gradient(180deg, $bg-card 0%, $bg-deepest 100%);
  min-height: 100vh;
  padding: $space-lg;
  font-family: monospace;
  color: $text-light;
}

/* 控制器区域 */
.controller-area {
  background: linear-gradient(180deg, $bg-card, darken($bg-card, 5%));
  border-radius: $radius-lg;
  padding: $space-md;
  box-shadow: 0 5px 0 $bg-deepest, $shadow-md;
  border: 1px solid rgba($cyber-primary, 0.08);
}

/* ========================================
   模态框样式 + 动画
   ======================================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba($bg-deepest, 0.9);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn $transition-normal ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  width: 90%;
  max-width: 400px;
  background: linear-gradient(180deg, $bg-card, $bg-dark);
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba($cyber-primary, 0.15),
    $shadow-glow-cyan;
  animation: slideUp 0.35s $ease-bounce;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-md;
  background: linear-gradient(135deg, rgba($cyber-primary, 0.08), rgba($cyber-secondary, 0.08));
  border-bottom: 1px solid rgba($cyber-primary, 0.2);
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  background: $gradient-gold;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-close {
  font-size: 22px;
  color: $text-dim;
  padding: 6px 12px;
  border-radius: $radius-sm;
  transition: all $transition-fast;
  
  &:active {
    background: rgba($cyber-danger, 0.15);
    color: $cyber-danger;
  }
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

.history-modal {
  max-height: 85vh;
  width: 95%;
  max-width: 400px;
}
</style>