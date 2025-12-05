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
      :exp="growth.petXP.value"
      :hunger="growth.hunger.value"
      :bond="growth.bond.value"
      :petEmoji="(growth && growth.petDisplay && growth.petDisplay.value) ? growth.petDisplay.value.emoji : '👻'"
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
        @toggle-pet="handleTogglePet"
        @toggle-monitor="handleToggleMonitor"
        @open-history="openHistory"
      />

      <!-- 配置面板 -->
      <ConfigPanel 
        v-if="currentTab === 'config'"
        :monitorIntervalTime="monitor.monitorIntervalTime.value"
        @open-selector="openSelector"
        @interval-change="handleIntervalChange"
        @open-terminal="terminal.showTerminal.value = true"
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

// 导入 Composables
import { useGrowth } from './composables/useGrowth.js';
import { useGrowthLog } from './composables/useGrowthLog.js';
import { useAI } from './composables/useAI.js';
import { useChat } from './composables/useChat.js';
import { useFloatWindow } from './composables/useFloatWindow.js';
import { useMonitor } from './composables/useMonitor.js';
import { usePermissions } from './composables/usePermissions.js';
import { useTerminal } from './composables/useTerminal.js';
import { ref } from 'vue';

// ========== 1. 初始化 Composables ==========

// 1.1 成长系统
const growth = useGrowth();

// 1.2 成长日志系统
const growthLog = useGrowthLog();

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
    sendToFloat: floatWindow.sendMessageToFloat,
    onPermissionDenied: (type) => {
        permissions.requestPermission(type);
    },
    addLog: terminal.addLog
});

// ========== 2. 页面状态 ==========

// 当前选中的 Tab
const currentTab = ref('status');

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
    
    // 加载成长日志
    growthLog.loadCachedData();
    
    // 加载聊天历史
    chat.loadMessages();
});

// ========== 4. 事件处理器 ==========

/**
 * 切换宠物显示
 */
const handleTogglePet = () => {
    logUserAction('切换宠物显示', { 当前状态: floatWindow.isPetShown.value ? '显示中' : '隐藏' });
    permissions.checkPermissions();
    floatWindow.togglePet(permissions.hasFloatPermission.value);
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
};
</script>

<style lang="scss">
$bg-color: #1a1a2e;
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
</style>