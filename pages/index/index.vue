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
            <text class="panel-title">📝 成长日记</text>
            <scroll-view scroll-y="true" class="growth-scroll">
                <view v-for="(item, index) in growthLogs" :key="index" class="log-item">
                    <text class="log-time">[{{ item.time }}]</text>
                    <text class="log-content">{{ item.msg }}</text>
                    <text class="log-val" :class="item.val > 0 ? 't-green' : 't-red'">
                        {{ item.val > 0 ? '+' : '' }}{{ item.val }}
                    </text>
                </view>
                <view v-if="growthLogs.length === 0" class="empty-log">暂无记录...</view>
            </scroll-view>
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
import { FloatWindow } from "@/uni_modules/android-floatwindow"; 

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
      growthLogs: [], // 成长日记数据
      
      // 系统数据
      logText: ">>> 系统初始化...\n",
      scrollTop: 9999,
      isPetShown: false,
      isMonitoring: false,
      monitorIntervalTime: 3000,
      
      hasFloatPermission: false,
      hasUsagePermission: false,
      floatWinInstance: null,
      monitorInterval: null,
      lastPackage: "" 
    };
  },
  onShow() {
      this.checkPermissions();
      if (!this.floatWinInstance) {
          this.floatWinInstance = new FloatWindow();
      }
      this.petMessage = this.isPetShown ? "我在看着你..." : "zzz...";
  },
  methods: {
    showToast(msg) {
        uni.showToast({ title: msg, icon: 'none' });
    },
	
    openSelector(mode) {
        // 1. 先显示 Loading
        uni.showLoading({ title: '准备中...', mask: true });
        
        // 2. 稍微延迟一点跳转，防止 UI 线程太忙没显示出 Loading
        setTimeout(() => {
            uni.hideLoading();
            uni.navigateTo({
                url: `/pages/config/app-selector?mode=${mode}`,
                // 失败回调
                fail: () => uni.hideLoading()
            });
        }, 100);
    },
	
    // 记录成长日记
    addGrowthLog(msg, val) {
        const time = new Date().toLocaleTimeString('zh-CN', {hour12: false});
        this.growthLogs.unshift({ time, msg, val }); // 最新的在最上面
    },

    // 记录系统日志
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
        if (this.isMonitoring) {
            this.toggleMonitor();
            setTimeout(() => { this.toggleMonitor(); }, 500);
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
    
            // 监听 Web 消息
            this.floatWinInstance.onListenerWebData((type, msg) => {
                console.log("Web消息:", type, msg);
                
                if (msg === 'pet_clicked') {
                     // 1. App内反馈
                     this.petMessage = "别戳我！去背单词！";
                     
                     // 2. 增加心情值并记录日记
                     this.mood = Math.min(100, this.mood + 2);
                     this.addGrowthLog("与宠物互动", 2);

                     // 3. 发送给悬浮窗 (显示气泡)
                     // 延迟一点确保渲染
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

    // --- 核心监控逻辑 ---
    checkCurrentApp() {
      try {
        const context = plus.android.runtimeMainActivity();
        const UsageStatsManager = plus.android.importClass("android.app.usage.UsageStatsManager");
        const Context = plus.android.importClass("android.content.Context");
        const System = plus.android.importClass("java.lang.System");
        const manager = context.getSystemService(Context.USAGE_STATS_SERVICE);
        
        if (!manager) return;

        const endTime = System.currentTimeMillis();
        const startTime = endTime - 10000; // 查询过去10秒的状态
        const statsList = manager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startTime, endTime);
        
        // 使用 invoke 调用 size，防止 native.js 兼容问题
        const size = plus.android.invoke(statsList, "size");
        
        if (size > 0) {
          let currentPackage = "";
          let lastTime = 0;
          
          // 遍历找到最新的前台应用
          for (let i = 0; i < size; i++) {
            const stats = plus.android.invoke(statsList, "get", i);
            const timeObj = plus.android.invoke(stats, "getLastTimeUsed");
            const pkgObj = plus.android.invoke(stats, "getPackageName");
            
            if (timeObj > lastTime) {
              lastTime = timeObj;
              currentPackage = pkgObj;
            }
          }

          // 过滤掉桌面启动器 (launcher) 和自己 (word-pet)
          // 注意：如果想监控自己，就把 currentPackage !== context.getPackageName() 去掉
          if (currentPackage && 
              currentPackage.indexOf("launcher") === -1 && 
              currentPackage.indexOf("home") === -1) {
              
              // 只有当包名发生变化时才触发逻辑，避免每3秒刷屏
              if (this.lastPackage !== currentPackage) {
                this.addLog("检测到应用切换: " + currentPackage);
                this.lastPackage = currentPackage;
                
                // --- 1. 读取配置 (同步读取本地存储) ---
                const whitelist = uni.getStorageSync('pet_whitelist') || [];
                const blacklist = uni.getStorageSync('pet_blacklist') || [];
                const appName = this.getAppName(currentPackage);

                // --- 2. 判定逻辑 ---
                if (whitelist.includes(currentPackage)) {
                    // ✅ 命中白名单 (学习软件)
                    this.mood = Math.min(100, this.mood + 5); // 心情+5 (上限100)
                    this.exp += 10; // 经验+10
                    
                    // 记录日记
                    this.addGrowthLog(`投喂成功 (${appName})`, 5);
                    this.addLog(`>>> 正在学习: ${appName} (经验+10)`);
                    
                    // 让宠物开心 (发送 Type 1 消息给 HTML)
                    if(this.floatWinInstance) {
                         this.floatWinInstance.sendDataToJs(1, "好耶！是精神食粮！<br>经验+10");
                    }

                } else if (blacklist.includes(currentPackage)) {
                    // ❌ 命中黑名单 (娱乐软件)
                    this.mood = Math.max(0, this.mood - 10); // 心情-10 (下限0)
                    
                    // 记录日记
                    this.addGrowthLog(`误食毒药 (${appName})`, -10);
                    this.addLog(`>>> 警告: 正在摸鱼 ${appName} (心情-10)`);
                    
                    // 让宠物愤怒 (发送 Type 2 消息给 HTML，触发红色特效)
                    if(this.floatWinInstance) {
                         this.floatWinInstance.sendDataToJs(2, "你在干什么？！<br>快去背单词！(💢)");
                    }

                } else {
                    // ⚪ 未知/中性应用
                    // 稍微扣一点心情，表示无聊，或者不扣
                    this.mood = Math.max(0, this.mood - 1);
                    this.addLog(`>>> 正在使用: ${appName} (未知应用)`);
                    
                    // 恢复平静 (Type 3)
                    if(this.floatWinInstance) {
                         this.floatWinInstance.sendDataToJs(3, ""); 
                    }
                }
              }
          }
        }
      } catch (e) {
        // 这里的报错通常可以忽略，不影响下次运行
        console.log("Monitor tick error:", e); 
      }
    },

    // --- 辅助方法：简单获取应用显示名称 ---
    getAppName(pkg) {
        // 这里的逻辑比较简单，直接取包名的最后一部分作为名字显示
        // 例如: com.tencent.mm -> mm
        // 实际开发中，可以在 app-selector 选择时把中文名一并存入 Storage，这里再取出来
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
    padding: 10px;
    margin-top: 10px;
}
.panel-title { font-size: 12px; color: $text-dim; margin-bottom: 8px; display: block; }
.growth-scroll { height: 80px; }
.log-item { display: flex; font-size: 11px; margin-bottom: 4px; }
.log-time { color: #666; margin-right: 5px; }
.log-content { flex: 1; color: #ccc; }
.log-val { font-weight: bold; }
.t-green { color: $accent-green; }
.t-red { color: $accent-red; }
.empty-log { color: #444; text-align: center; font-size: 10px; padding: 10px; }

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