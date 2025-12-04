<template>
  <view class="game-container">
    <!-- 状态栏组件 -->
    <StatusBar 
      :petLevel="growth ? growth.petLevel.value : 1" 
      :coins="growth ? growth.coins.value : 0" 
    />

    <!-- 宠物显示屏组件 -->
    <PetScreen 
      :isMonitoring="isMonitoring"
      :isPetShown="isPetShown"
      :petMessage="petMessage"
      :mood="growth ? growth.mood.value : 80"
      :exp="growth ? growth.petXP.value : 0"
      :hunger="growth ? growth.hunger.value : 100"
      :bond="growth ? growth.bond.value : 0"
      :petEmoji="(growth && growth.petDisplay && growth.petDisplay.value) ? growth.petDisplay.value.emoji : '👻'"
    />

    <!-- 控制器区域 -->
    <view class="controller-area">
      <!-- Tab 切换组件 -->
      <TabSwitch :currentTab="currentTab" @update:currentTab="currentTab = $event" />

      <!-- 状态面板 -->
      <StatusPanel 
        v-if="currentTab === 'status'"
        :hasFloatPermission="hasFloatPermission"
        :hasUsagePermission="hasUsagePermission"
        :isPetShown="isPetShown"
        :isMonitoring="isMonitoring"
        :growthLogs="growthLogs"
        @toggle-pet="handleTogglePet"
        @toggle-monitor="handleToggleMonitor"
        @open-history="openHistory"
      />

      <!-- 配置面板 -->
      <ConfigPanel 
        v-if="currentTab === 'config'"
        :monitorIntervalTime="monitorIntervalTime"
        @open-selector="openSelector"
        @interval-change="handleIntervalChange"
        @open-terminal="showTerminal = true"
      />
      
      <!-- 聊天面板 -->
      <ChatPanel
        v-if="currentTab === 'chat' && chatMethods"
        :messages="chatMessages"
        :userInput="chatUserInput"
        :isSending="chatIsSending"
        :quickReplies="chatQuickReplies"
        :petEmoji="(growth && growth.petDisplay && growth.petDisplay.value) ? growth.petDisplay.value.emoji : '👻'"
        @update:userInput="handleUserInputUpdate"
        @send-message="handleSendMessage"
        @quick-reply="handleQuickReply"
      />
    </view>

    <!-- 终端弹窗组件 -->
    <TerminalModal 
      :showTerminal="showTerminal"
      :isMonitoring="isMonitoring"
      :logText="logText"
      :scrollTop="scrollTop"
      @close="showTerminal = false"
      @clear-log="logText = ''"
    />
  </view>
</template>

<script>
// 导入组件
import StatusBar from './components/StatusBar.vue';
import PetScreen from './components/PetScreen.vue';
import TabSwitch from './components/TabSwitch.vue';
import StatusPanel from './components/StatusPanel.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import TerminalModal from './components/TerminalModal.vue';
import ChatPanel from './components/ChatPanel.vue';

// 导入原生插件和工具
import { FloatWindow } from "@/uni_modules/android-floatwindow";
import { useAI } from './composables/useAI.js';
import { useGrowth } from './composables/useGrowth.js';
import { useChat } from './composables/useChat.js';
import { debugLog, logUserAction, logAI, logMonitor, logError, logSuccess } from '@/utils/debugLog.js';

export default {
  components: {
    StatusBar,
    PetScreen,
    TabSwitch,
    StatusPanel,
    ConfigPanel,
    TerminalModal,
    ChatPanel
  },

  data() {
    return {
      currentTab: 'status',
      showTerminal: false,
      logText: ">>> 系统初始化...\n",
      scrollTop: 9999,
      
      // 游戏数据（将由 composables 管理）
      petMessage: "等待指令...",
      growthLogs: [],
      
      // 系统状态
      isPetShown: false,
      isMonitoring: false,
      monitorIntervalTime: 3000,
      
      // 权限状态
      hasFloatPermission: false,
      hasUsagePermission: false,
      
      // 原生插件实例
      floatWinInstance: null,
      monitorInterval: null,
      lastPackage: "",
      
      // AI 冷却
      lastAiReq: 0,
      
      // Composables 实例
      growth: null,
      chat: null,
      ai: null
    };
  },

  created() {
    // 初始化 Composables
    this.growth = useGrowth();
    
    // chat composable 需要特殊处理以保持 ref 的响应性
    const chatComposable = useChat();
    // 直接将 ref 存储为属性，Vue 3 会自动处理
    this.chatMessages = chatComposable.messages;
    this.chatUserInput = chatComposable.userInput;
    this.chatIsSending = chatComposable.isSending;
    this.chatQuickReplies = chatComposable.quickReplies;
    this.chatMethods = {
      loadMessages: chatComposable.loadMessages,
      sendMessage: chatComposable.sendMessage,
      sendQuickReply: chatComposable.sendQuickReply
    };
    
    this.ai = useAI();
    
    console.log('[index.vue created] chatUserInput ref:', this.chatUserInput);
    
    // 加载成长系统数据
    if (this.growth) {
      this.growth.loadData();
    }
    // 加载聊天历史
    if (this.chatMethods) {
      this.chatMethods.loadMessages();
    }
  },

  onShow() {
    logUserAction('页面显示', { isPetShown: this.isPetShown, isMonitoring: this.isMonitoring });
    this.checkPermissions();
    
    // 页面恢复时重建悬浮窗实例
    if (!this.floatWinInstance && this.isPetShown) {
      this.floatWinInstance = new FloatWindow();
    }
    this.petMessage = this.isPetShown ? "我在看着你..." : "zzz...";
    
    // 读取日志缓存
    const fullLogs = uni.getStorageSync('pet_growth_logs') || [];
    this.growthLogs = fullLogs.slice(0, 3);
    
    // 读取心情缓存
    const cachedMood = uni.getStorageSync('pet_mood_cache');
    if (cachedMood !== '' && cachedMood !== null) {
      this.mood = cachedMood;
    }
  },

  methods: {
    addLog(msg) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      this.logText += `[${time}] ${msg}\n`;
      this.scrollTop += 50;
    },

    // 成长日志
    addGrowthLog(msg, val) {
      const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
      const timestamp = Date.now();
      const newLog = { time, msg, val, timestamp };

      this.growthLogs.unshift(newLog);
      if (this.growthLogs.length > 3) this.growthLogs.pop();

      try {
        let history = uni.getStorageSync('pet_growth_logs') || [];
        history.unshift(newLog);
        if (history.length > 500) history = history.slice(0, 500);
        uni.setStorageSync('pet_growth_logs', history);
        uni.setStorageSync('pet_mood_cache', this.mood);
      } catch (e) {
        console.error("日志存储失败", e);
      }
    },

    // AI 评论
    async triggerPetComment(appName, type) {
      const now = Date.now();
      if (now - this.lastAiReq < 60000) {
        const fallback = type === 'bad' ? "还在玩？！<br>😡" : "继续保持！<br>❤️";
        const msgType = type === 'bad' ? 2 : 1;
        if (this.floatWinInstance) this.floatWinInstance.sendDataToJs(msgType, fallback);
        return;
      }
      
      this.lastAiReq = now;
      
      // 确保传递 addLog 方法
      if (this.ai && this.ai.triggerPetComment) {
        await this.ai.triggerPetComment(
          appName, 
          type, 
          (msgType, msg) => {
            if (this.floatWinInstance) this.floatWinInstance.sendDataToJs(msgType, msg);
          }, 
          (logMsg) => {
            this.addLog(logMsg);
          }
        );
      }
    },

    // 权限检查
    checkPermissions() {
      if (uni.getSystemInfoSync().platform !== 'android') return;
      try {
        const Settings = plus.android.importClass("android.provider.Settings");
        const context = plus.android.runtimeMainActivity();
        this.hasFloatPermission = Settings.canDrawOverlays(context);
        const AppOpsManager = plus.android.importClass("android.app.AppOpsManager");
        const Process = plus.android.importClass("android.os.Process");
        const appOps = context.getSystemService(context.APP_OPS_SERVICE);
        const mode = appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          context.getPackageName()
        );
        this.hasUsagePermission = (mode === AppOpsManager.MODE_ALLOWED);
      } catch (e) {
        console.error('权限检查失败:', e);
      }
    },

    // 请求权限
    requestPermission(type) {
      const main = plus.android.runtimeMainActivity();
      const Intent = plus.android.importClass("android.content.Intent");
      const Settings = plus.android.importClass("android.provider.Settings");
      const Uri = plus.android.importClass("android.net.Uri");

      if (type === 'float') {
        const intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
        intent.setData(Uri.parse("package:" + main.getPackageName()));
        main.startActivity(intent);
      } else if (type === 'usage') {
        const intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        main.startActivity(intent);
      }
    },

    // 悬浮窗控制
    handleTogglePet() {
      logUserAction('切换宠物显示', { 当前状态: this.isPetShown ? '显示中' : '隐藏' });
      this.checkPermissions();
      if (!this.hasFloatPermission) {
        this.addLog("错误: 缺少悬浮窗权限");
        this.requestPermission('float');
        return;
      }

      if (this.isPetShown) {
        if (this.floatWinInstance) {
          try { this.floatWinInstance.dismiss(); } catch(e) {}
        }
        this.isPetShown = false;
        this.petMessage = "zzz...";
        this.addLog("系统: 寄生兽已收回");
      } else {
        this.showFloatWindow();
      }
    },

    showFloatWindow() {
      try {
        const rawPath = '/static/pet.html';
        const absolutePath = plus.io.convertLocalFileSystemURL(rawPath);
        
        if (!this.floatWinInstance) {
          this.floatWinInstance = new FloatWindow();
        }

        this.floatWinInstance.loadUrl(absolutePath);
        const w = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        const h = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        this.floatWinInstance.setFixedWidthHeight(true, w, h);
        
        const x = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        const y = this.floatWinInstance.convertHtmlPxToAndroidPx(300);
        this.floatWinInstance.setLocation(x, y);

        this.floatWinInstance.setShowPattern(3);
        this.floatWinInstance.setDragEnable(true);

        // 监听 Web 消息
        this.floatWinInstance.onListenerWebData((type, msg) => {
          if (msg === 'pet_clicked') {
            this.petMessage = "别戳我！去背单词！";
            this.mood = Math.min(100, this.mood + 2);
            this.addGrowthLog("与宠物互动", 2);
            setTimeout(() => {
              this.floatWinInstance.sendDataToJs(1, "别戳我！<br>去背单词！");
            }, 100);
          }
        });

        this.floatWinInstance.createAndShow();
        this.isPetShown = true;
        this.petMessage = "正在扫描环境...";
        this.addLog("系统: 寄生兽召唤成功");

      } catch (e) {
        console.error(e);
        this.addLog("错误: " + e.message);
        this.floatWinInstance = null;
      }
    },

    // 监控控制
    handleToggleMonitor() {
      logUserAction('切换监控状态', { 当前状态: this.isMonitoring ? '监控中' : '停止' });
      this.checkPermissions();
      if (!this.hasUsagePermission) {
        this.addLog("错误: 缺少监控权限");
        this.requestPermission('usage');
        return;
      }

      if (this.isMonitoring) {
        clearInterval(this.monitorInterval);
        this.isMonitoring = false;
        this.addLog("监控: 已停止");
      } else {
        this.isMonitoring = true;
        this.addLog(`监控: 已开启 (频率: ${this.monitorIntervalTime}ms)`);
        this.checkCurrentApp();
        this.monitorInterval = setInterval(() => {
          this.checkCurrentApp();
        }, this.monitorIntervalTime);
      }
    },

    // 监控核心
    checkCurrentApp() {
      try {
        const context = plus.android.runtimeMainActivity();
        const UsageStatsManager = plus.android.importClass("android.app.usage.UsageStatsManager");
        const Context = plus.android.importClass("android.content.Context");
        const System = plus.android.importClass("java.lang.System");
        const manager = context.getSystemService(Context.USAGE_STATS_SERVICE);
        
        if (!manager) return;

        const endTime = System.currentTimeMillis();
        const startTime = endTime - 10000;
        const statsList = manager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startTime, endTime);
        
        const size = plus.android.invoke(statsList, "size");
        
        if (size > 0) {
          let currentPackage = "";
          let lastTime = 0;
          
          for (let i = 0; i < size; i++) {
            const stats = plus.android.invoke(statsList, "get", i);
            const timeObj = plus.android.invoke(stats, "getLastTimeUsed");
            const pkgObj = plus.android.invoke(stats, "getPackageName");
            
            if (timeObj > lastTime) {
              lastTime = timeObj;
              currentPackage = pkgObj;
            }
          }

          if (currentPackage && 
              currentPackage.indexOf("launcher") === -1 && 
              currentPackage.indexOf("home") === -1) {
              
              if (this.lastPackage !== currentPackage) {
                this.addLog("检测到应用切换: " + currentPackage);
                this.lastPackage = currentPackage;
                
                const whitelist = uni.getStorageSync('pet_whitelist') || [];
                const blacklist = uni.getStorageSync('pet_blacklist') || [];
                const appName = this.getAppName(currentPackage);

                if (whitelist.includes(currentPackage)) {
                  // 白名单
                  this.mood = Math.min(100, this.mood + 5);
                  this.exp += 10;
                  this.addGrowthLog(`投喂成功 (${appName})`, 5);
                  this.addLog(`>>> 正在学习: ${appName} (经验+10)`);
                  this.triggerPetComment(appName, 'good');

                } else if (blacklist.includes(currentPackage)) {
                  // 黑名单
                  this.mood = Math.max(0, this.mood - 10);
                  this.addGrowthLog(`误食毒药 (${appName})`, -10);
                  this.addLog(`>>> 警告: 正在摸鱼 ${appName} (心情-10)`);
                  this.triggerPetComment(appName, 'bad');

                } else {
                  // 未知应用
                  this.mood = Math.max(0, this.mood - 1);
                  this.addLog(`>>> 正在使用: ${appName}`);
                  if (this.floatWinInstance) {
                    this.floatWinInstance.sendDataToJs(3, "");
                  }
                }
              }
          }
        }
      } catch (e) {
        console.log("Monitor tick error:", e);
      }
    },

    getAppName(pkg) {
      if (!pkg) return "未知";
      const parts = pkg.split('.');
      return parts[parts.length - 1];
    },

    handleIntervalChange(value) {
      this.monitorIntervalTime = value;
      this.addLog(`配置更新: 扫描间隔 -> ${this.monitorIntervalTime}ms`);
      if (this.isMonitoring) {
        clearInterval(this.monitorInterval);
        this.monitorInterval = setInterval(() => {
          this.checkCurrentApp();
        }, this.monitorIntervalTime);
      }
    },

    openSelector(mode) {
      uni.showLoading({ title: '准备中...', mask: true });
      setTimeout(() => {
        uni.hideLoading();
        uni.navigateTo({
          url: `/pages/config/app-selector?mode=${mode}`,
          fail: () => uni.hideLoading()
        });
      }, 100);
    },

    openHistory() {
      uni.navigateTo({ url: '/pages/log/log-history' });
    },
    
    // ========== 聊天功能相关方法 ==========
    
    /**
     * 处理用户输入更新
     */
    handleUserInputUpdate(value) {
      console.log('[index.vue] handleUserInputUpdate', value);
      if (this.chatUserInput) {
        this.chatUserInput.value = value;
        console.log('[index.vue] 更新后:', this.chatUserInput.value);
      }
    },
    
    /**
     * 处理发送消息
     */
    async handleSendMessage(content) {
      logUserAction('发送消息', { 内容: content.substring(0, 30) });
      if (!this.chatMethods || !this.ai) return;
      
      const context = {
        level: this.growth.petLevel.value,
        mood: this.growth.mood.value,
        todayStudyTime: this.growth.todayStudyTime.value,
        todayIdleTime: this.growth.todayIdleTime.value
      };
      
      await this.chatMethods.sendMessage(
        content,
        async (userMsg, ctx) => {
          try {
            const reply = await this.ai.chatWithPet(userMsg, ctx);
            return reply;
          } catch (e) {
            console.error('AI 回复失败:', e);
            return '抱歉，我走神了...😅';
          }
        },
        context
      );
    },
    
    async handleQuickReply(replyId) {
      logUserAction('点击快捷回复', { replyId });
      if (!this.chatMethods || !this.growth) return;
      
      const context = {
        level: this.growth.petLevel.value,
        mood: this.growth.mood.value,
        todayStudyTime: this.growth.todayStudyTime.value,
        todayIdleTime: this.growth.todayIdleTime.value
      };
      
      this.chatMethods.sendQuickReply(
        replyId,
        async (userMsg, ctx) => {
          try {
            const reply = await this.ai.chatWithPet(userMsg, ctx);
            return reply;
          } catch (e) {
            return '嗯...让我想想 💭';
          }
        },
        context
      );
    }
  }
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