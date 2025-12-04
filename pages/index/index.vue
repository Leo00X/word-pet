<template>
  <view class="game-container">
    <view class="status-bar">
      <view class="level-box">
        <text class="pixel-text">等级.{{ petLevel }}</text>
      </view>
      <view class="coin-box">
        <text class="coin-icon">🪙</text>
        <text class="pixel-text">{{ coins }}</text>
      </view>
    </view>

    <view class="main-screen">
      <view class="screen-content" :class="{ 'glitch-effect': isMonitoring }">
        <image 
          class="pet-avatar" 
          :class="{ 'floating': isPetShown }"
          src="/static/logo.png" 
          mode="aspectFit"
        ></image>
        
        <view class="pixel-bubble" v-if="isPetShown">
          <text>{{ petMessage }}</text>
        </view>

        <view class="stats-overlay">
          <view class="stat-row">
            <text class="stat-label">心情</text>
            <progress class="stat-bar" :percent="mood" activeColor="#ff4757" backgroundColor="#2f3542" stroke-width="6" />
          </view>
          <view class="stat-row">
            <text class="stat-label">经验</text>
            <progress class="stat-bar" :percent="exp" activeColor="#2ed573" backgroundColor="#2f3542" stroke-width="6" />
          </view>
        </view>
      </view>
    </view>

    <view class="controller-area">
      <view class="tab-switch">
        <view 
          class="tab-btn" 
          :class="{ active: currentTab === 'status' }"
          @click="currentTab = 'status'"
        >
          状态监控
        </view>
        <view 
          class="tab-btn" 
          :class="{ active: currentTab === 'config' }"
          @click="currentTab = 'config'"
        >
          系统设置
        </view>
      </view>

      <view v-if="currentTab === 'status'" class="panel-body">
        
        <view class="mini-status-row">
           <text class="mini-label">系统连接:</text>
           <text class="perm-tag" :class="hasFloatPermission ? 'ok' : 'ng'">{{ hasFloatPermission ? '悬浮窗正常' : '悬浮窗断开' }}</text>
           <text class="perm-tag" :class="hasUsagePermission ? 'ok' : 'ng'">{{ hasUsagePermission ? '监控正常' : '监控断开' }}</text>
        </view>

        <button 
          class="game-btn big-btn" 
          :class="isPetShown ? 'btn-red' : 'btn-green'"
          @click="togglePet"
        >
          {{ isPetShown ? '收回寄生兽' : '召唤寄生兽' }}
        </button>

        <button 
          class="game-btn mid-btn" 
          :class="isMonitoring ? 'btn-yellow' : 'btn-blue'"
          @click="toggleMonitor"
        >
          {{ isMonitoring ? '⏹ 停止全域监控' : '👁 开启全域监控' }}
        </button>

        <view class="log-card">
            <view class="log-header-row">
                <text class="panel-title">📝 最近动态</text>
                <text class="more-btn" @click="openHistory">查看全部档案 ></text>
            </view>
            
            <view class="growth-preview">
                <view v-for="(item, index) in growthLogs" :key="index" class="log-item">
                    <text class="log-time">[{{ item.time }}]</text>
                    <text class="log-content">{{ item.msg }}</text>
                    <text class="log-val" :class="item.val > 0 ? 't-green' : 't-red'">
                        {{ item.val > 0 ? '+' : '' }}{{ item.val }}
                    </text>
                </view>
                <view v-if="growthLogs.length === 0" class="empty-log">暂无今日记录...</view>
            </view>
        </view>
      </view>

      <view v-if="currentTab === 'config'" class="panel-body">
        
        <view class="setting-item" @click="openSelector('whitelist')">
          <view class="icon-box">🍖</view>
          <view class="setting-text">
            <text class="main-text">投喂规则 (白名单)</text>
            <text class="sub-text">设置作为“食物”的学习软件</text>
          </view>
          <text class="arrow">></text>
        </view>

        <view class="setting-item" @click="openSelector('blacklist')">
          <view class="icon-box">☠️</view>
          <view class="setting-text">
            <text class="main-text">禁忌物品 (黑名单)</text>
            <text class="sub-text">设置会让宠物暴走的娱乐软件</text>
          </view>
          <text class="arrow">></text>
        </view>

        <view class="setting-block">
          <text class="block-title">扫描频率 ({{ (monitorIntervalTime / 1000).toFixed(0) }} 秒/次)</text>
          <slider 
            :value="monitorIntervalTime" 
            min="3000" 
            max="60000" 
            step="1000" 
            activeColor="#2ed573" 
            backgroundColor="#57606f"
            block-color="#ffa502"
            block-size="18"
            @change="onIntervalChange"
          />
        </view>

        <button class="game-btn terminal-btn" @click="openMonitorTerminal">
          <text>🖥️ 进入监控终端</text>
        </button>
      </view>
    </view>

    <view class="terminal-modal" v-if="showTerminal">
      <view class="terminal-window">
        <view class="terminal-header">
          <text class="terminal-title">管理员@单词寄生兽:~#</text>
          <text class="close-x" @click="showTerminal = false">[ 关闭 ]</text>
        </view>
        <view class="terminal-toolbar">
           <text :style="{color: isMonitoring ? '#2ed573' : '#ff4757'}">
             状态: {{ isMonitoring ? '运行中' : '已停止' }}
           </text>
           <text class="btn-text" @click="logText=''">[清空屏幕]</text>
        </view>
        <scroll-view scroll-y="true" class="log-scroll" :scroll-top="scrollTop">
          <text class="log-text">{{ logText }}</text>
        </scroll-view>
      </view>
    </view>

  </view>
</template>

<script>
// 1. 引入 UTS 悬浮窗插件
import { FloatWindow } from "@/uni_modules/android-floatwindow"; 
// 2. 引入 AI 工具 (⚠️请确保你已创建 utils/deepseek.js)
import { chatWithAI } from "@/utils/deepseek.js"; 

export default {
  data() {
    return {
      currentTab: 'status',
      showTerminal: false,
      
      // 游戏数据
      petLevel: 1,
      coins: 128,
      mood: 80, 
      exp: 45,
      petMessage: "等待指令...",
      growthLogs: [], 
      
      // 系统数据
      logText: ">>> 系统初始化...\n",
      scrollTop: 9999,
      isPetShown: false,
      isMonitoring: false,
      monitorIntervalTime: 3000,
      
      // 权限与插件对象
      hasFloatPermission: false,
      hasUsagePermission: false,
      floatWinInstance: null,
      monitorInterval: null,
      lastPackage: "",
      
      // AI 请求冷却时间 (毫秒时间戳)
      lastAiReq: 0 
    };
  },
  onShow() {
      this.checkPermissions();
      // 页面显示时，如果已有实例但不完整，重新初始化
      if (!this.floatWinInstance && this.isPetShown) {
          // 这种情况通常是页面被回收但悬浮窗还在，这里只做简单的对象重建
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
    showToast(msg) {
        uni.showToast({ title: msg, icon: 'none' });
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
    
    // 🔥 核心：记录成长日记
    addGrowthLog(msg, val) {
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
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

    addLog(msg) {
      const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
      this.logText += `[${time}] ${msg}\n`;
      this.scrollTop += 50;
    },

    openMonitorTerminal() {
        this.showTerminal = true;
    },

    onIntervalChange(e) {
        this.monitorIntervalTime = e.detail.value;
        this.addLog(`配置更新: 扫描间隔 -> ${this.monitorIntervalTime}ms`);
        // 重启监控以应用新频率
        if (this.isMonitoring) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = setInterval(() => {
                this.checkCurrentApp();
            }, this.monitorIntervalTime);
        }
    },

    // --- AI 评论触发器 ---
    async triggerPetComment(appName, type) {
        // 1. 冷却检查 (60秒内不重复请求 AI，省钱且防刷屏)
        const now = Date.now();
        if (now - this.lastAiReq < 60000) {
             // 冷却期使用本地兜底文案
             const fallback = type === 'bad' ? "还在玩？！<br>😡" : "继续保持！<br>❤️";
             const msgType = type === 'bad' ? 2 : 1; 
             if(this.floatWinInstance) this.floatWinInstance.sendDataToJs(msgType, fallback);
             return;
        }
        
        // 更新上次请求时间
        this.lastAiReq = now;
        this.addLog("🤖 正在请求 DeepSeek 评价...");
        
        // 2. 构建提示词
        let systemPrompt = "";
        let userPrompt = "";
        
        if (type === 'bad') {
            systemPrompt = "你是一个寄生在手机里的毒舌外星生物。用户正在浪费时间玩娱乐软件，请用嘲讽、刻薄、阴阳怪气的语气骂醒他。字数30字以内。不要只有标点符号。";
            userPrompt = `我正在玩《${appName}》，我已经玩了很久了，快骂我。`;
        } else {
            systemPrompt = "你是一个傲娇的电子宠物。用户正在学习，请用勉为其难但其实在鼓励的语气表扬他。字数30字以内。";
            userPrompt = `我正在使用学习软件《${appName}》。`;
        }

        try {
            // 3. 调用 AI
            const reply = await chatWithAI(userPrompt, systemPrompt);
            this.addLog("👻 寄生兽说: " + reply);
            
            // 4. 发送给悬浮窗 (Type 2=愤怒红色, 1=普通绿色)
            const msgType = type === 'bad' ? 2 : 1; 
            
            if (this.floatWinInstance) {
                this.floatWinInstance.sendDataToJs(msgType, reply);
            }
        } catch (error) {
            console.error("AI Error", error);
            this.addLog("❌ AI连接失败，使用本地语音");
            // 失败兜底
            const fallback = type === 'bad' ? "网络太差了...<br>就像你的自律性！" : "网络断了...<br>但在学习是好事。";
            if(this.floatWinInstance) this.floatWinInstance.sendDataToJs(type === 'bad' ? 2 : 1, fallback);
        }
    },

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
      } catch (e) { console.error(e); }
    },
    
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

    togglePet() {
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
    
            // 监听 Web 消息 (双向通信)
            this.floatWinInstance.onListenerWebData((type, msg) => {
                console.log("Web消息:", type, msg);
                
                if (msg === 'pet_clicked') {
                     // 1. App内反馈
                     this.petMessage = "别戳我！去背单词！";
                     
                     // 2. 增加心情值并记录日记
                     this.mood = Math.min(100, this.mood + 2);
                     this.addGrowthLog("与宠物互动", 2);

                     // 3. 互动反馈 (无需调用 AI，直接本地回复)
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

    toggleMonitor() {
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

    // --- 监控核心逻辑 ---
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

          // 排除桌面启动器
          if (currentPackage && 
              currentPackage.indexOf("launcher") === -1 && 
              currentPackage.indexOf("home") === -1) {
              
              if (this.lastPackage !== currentPackage) {
                this.addLog("检测到应用切换: " + currentPackage);
                this.lastPackage = currentPackage;
                
                // 获取用户配置的黑白名单
                const whitelist = uni.getStorageSync('pet_whitelist') || [];
                const blacklist = uni.getStorageSync('pet_blacklist') || [];
                const appName = this.getAppName(currentPackage);

                // --- 规则判定 ---
                if (whitelist.includes(currentPackage)) {
                    // ✅ 白名单 (学习软件)
                    this.mood = Math.min(100, this.mood + 5); 
                    this.exp += 10;
                    this.addGrowthLog(`投喂成功 (${appName})`, 5);
                    this.addLog(`>>> 正在学习: ${appName} (经验+10)`);
                    
                    // 触发鼓励模式
                    this.triggerPetComment(appName, 'good');

                } else if (blacklist.includes(currentPackage)) {
                    // ❌ 黑名单 (娱乐软件)
                    this.mood = Math.max(0, this.mood - 10);
                    this.addGrowthLog(`误食毒药 (${appName})`, -10);
                    this.addLog(`>>> 警告: 正在摸鱼 ${appName} (心情-10)`);
                    
                    // 🔥 触发毒舌模式 (AI介入)
                    this.triggerPetComment(appName, 'bad');

                } else {
                    // ⚠️ 未知应用 (中立)
                    this.mood = Math.max(0, this.mood - 1);
                    this.addLog(`>>> 正在使用: ${appName}`);
                    
                    // 恢复正常表情
                    if(this.floatWinInstance) {
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
    }
  }
}
</script>

<style lang="scss">
$bg-color: #1a1a2e;
$card-bg: #16213e;
$accent-red: #ff4757;
$accent-green: #2ed573;
$accent-yellow: #ffa502;
$accent-blue: #3742fa;
$text-light: #f1f2f6;
$text-dim: #747d8c;

.game-container {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 20px;
  font-family: monospace;
  color: $text-light;
}

/* 顶部状态 */
.status-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 0 5px;
}
.pixel-text {
  font-weight: bold;
  font-size: 16px;
  text-shadow: 2px 2px #000;
}
.coin-box { display: flex; align-items: center; gap: 5px; }

/* 游戏屏幕 */
.main-screen {
  background: #000;
  border: 4px solid #2f3542;
  border-radius: 10px;
  height: 260px;
  position: relative;
  overflow: hidden;
  margin-bottom: 25px;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
}
.screen-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #2f3640 0%, #000 90%);
}

.pet-avatar {
  width: 100px;
  height: 100px;
  z-index: 10;
  transition: all 0.5s ease;
}
.floating { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }

.pixel-bubble {
  background: #fff;
  color: #000;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  margin-top: 10px;
  position: relative;
  max-width: 80%;
  text-align: center;
}
.pixel-bubble::after {
  content: ''; position: absolute; top: -5px; left: 50%; transform: translateX(-50%);
  border-width: 0 5px 5px; border-style: solid; border-color: transparent transparent #fff;
}

.stats-overlay {
  position: absolute;
  top: 10px; left: 10px; right: 10px;
}
.stat-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 5px;
}
.stat-label { font-size: 10px; font-weight: bold; width: 30px; }
.stat-bar { flex: 1; border-radius: 4px; overflow: hidden; }

/* 控制器区域 */
.controller-area {
  background: $card-bg;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 5px 0 #0f1526;
}

.tab-switch {
  display: flex;
  background: #0f1526;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}
.tab-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
  border-radius: 6px;
  color: $text-dim;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #2f3542;
  color: $text-light;
  font-weight: bold;
}

/* 按钮样式 */
.game-btn {
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}
.game-btn:active { transform: translateY(4px); box-shadow: none; }
.big-btn { height: 50px; line-height: 50px; font-size: 16px; margin-bottom: 15px; }
.mid-btn { height: 40px; line-height: 40px; font-size: 14px; margin-bottom: 15px; }
.btn-green { background: $accent-green; }
.btn-red { background: $accent-red; }
.btn-blue { background: $accent-blue; }
.btn-yellow { background: $accent-yellow; color: #000; }
.terminal-btn { background: #2f3542; border: 1px solid #57606f; margin-top: 20px; font-size: 12px; }

/* 日志卡片 */
.log-card {
    background: #0f1526;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    border: 1px solid #2f3542;
}
.log-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    border-bottom: 1px dashed #2f3542;
    padding-bottom: 5px;
}
.panel-title { font-size: 13px; color: #a4b0be; font-weight: bold; margin: 0; }
.more-btn { font-size: 11px; color: #3742fa; padding: 2px 5px; }

.growth-preview { min-height: 60px; }
.log-item { display: flex; font-size: 11px; margin-bottom: 6px; align-items: center; }
.log-time { color: #57606f; margin-right: 8px; font-family: monospace; }
.log-content { flex: 1; color: #dfe4ea; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.log-val { font-weight: bold; margin-left: 5px; min-width: 25px; text-align: right; }
.t-green { color: #2ed573; }
.t-red { color: #ff4757; }
.empty-log { color: #57606f; text-align: center; font-size: 10px; padding: 10px; }

/* 状态标签 */
.mini-status-row { font-size: 10px; display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: $text-dim; }
.perm-tag { padding: 2px 6px; border-radius: 4px; background: #333; }
.perm-tag.ok { color: $accent-green; border: 1px solid $accent-green; }
.perm-tag.ng { color: $accent-red; border: 1px solid $accent-red; }

/* 配置项 */
.setting-item {
  display: flex; align-items: center;
  background: #2f3542;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}
.icon-box { font-size: 20px; margin-right: 12px; }
.setting-text { flex: 1; display: flex; flex-direction: column; }
.main-text { font-size: 14px; font-weight: bold; }
.sub-text { font-size: 10px; color: $text-dim; margin-top: 2px; }
.arrow { color: $text-dim; }
.setting-block { background: #2f3542; padding: 12px; border-radius: 8px; margin-top: 20px; }
.block-title { display: block; font-size: 12px; color: $text-dim; margin-bottom: 10px; }

/* 终端弹窗 */
.terminal-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 999;
  display: flex; align-items: center; justify-content: center;
}
.terminal-window {
  width: 90%; height: 70%;
  background: #000;
  border: 1px solid $accent-green;
  display: flex; flex-direction: column;
  box-shadow: 0 0 20px rgba(46, 213, 115, 0.2);
  padding: 10px;
}
.terminal-header {
  display: flex; justify-content: space-between;
  border-bottom: 1px dashed #333;
  padding-bottom: 5px; margin-bottom: 5px;
  color: $accent-green; font-size: 12px;
}
.terminal-toolbar {
  display: flex; gap: 15px; font-size: 12px; margin-bottom: 10px;
}
.btn-text { text-decoration: underline; color: #fff; }
.log-scroll { flex: 1; height: 0; }
.log-text { font-size: 10px; line-height: 1.4; color: $accent-green; }
</style>