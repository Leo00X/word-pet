<template>
  <view class="container">
    <view class="header">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">WordParasite</text>
      <text class="subtitle">它在看着你... (It watches you)</text>
    </view>

    <view class="card">
      <view class="card-header">控制核心</view>
      
      <!-- 状态指示 -->
      <view class="status-row">
        <view class="status-item">
          <text>悬浮权限: </text>
          <text :class="hasFloatPermission ? 't-green' : 't-red'">
            {{ hasFloatPermission ? '已获取' : '未获取' }}
          </text>
        </view>
        <view class="status-item">
          <text>监控权限: </text>
          <text :class="hasUsagePermission ? 't-green' : 't-red'">
            {{ hasUsagePermission ? '已获取' : '未获取' }}
          </text>
        </view>
      </view>

      <view class="btn-group">
        <button class="btn primary" @click="togglePet">
          {{ isPetShown ? '收回寄生兽' : '召唤寄生兽' }}
        </button>

        <button class="btn warning" @click="toggleMonitor">
          {{ isMonitoring ? '停止监控' : '开启全域监控' }}
        </button>
      </view>
    </view>

    <!-- 日志区 -->
    <view class="log-box">
      <view class="log-header">
        <text>运行日志</text>
        <text style="color: #00e676;" @click="logText=''">清空</text>
      </view>
      <scroll-view scroll-y="true" class="log-scroll" :scroll-top="scrollTop">
        <text class="log-text">{{ logText }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script>
// ⚠️ 确保路径正确，如果不确定文件夹名，去 uni_modules看一眼
import { FloatWindow } from "@/uni_modules/android-floatwindow"; 

export default {
  data() {
    return {
      logText: ">>> 系统初始化完成...\n",
      scrollTop: 9999,
      isPetShown: false,
      isMonitoring: false,
      hasFloatPermission: false,
      hasUsagePermission: false,
      floatWinInstance: null,
      monitorInterval: null,
      lastPackage: "" 
    };
  },
  // 使用 onShow 而不是 onLoad，这样从设置页回来能自动刷新状态
  onShow() {
    this.checkPermissions();
  },
  methods: {
    addLog(msg) {
      const time = new Date().toLocaleTimeString();
      this.logText += `[${time}] ${msg}\n`;
      this.scrollTop += 50;
    },

    // --- 1. 权限检测 ---
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
        console.error(e);
      }
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

    // --- 2. 召唤/隐藏 (修复 close 报错) ---
    togglePet() {
      this.checkPermissions();
      if (!this.hasFloatPermission) {
        this.addLog("❌ 缺悬浮权限");
        this.requestPermission('float');
        return;
      }

      if (this.isPetShown) {
        // 关闭逻辑：尝试多种销毁方法，防止报错
        if (this.floatWinInstance) {
          try {
            if (typeof this.floatWinInstance.close === 'function') {
                this.floatWinInstance.close();
            } else if (typeof this.floatWinInstance.destroy === 'function') {
                this.floatWinInstance.destroy();
            } else if (typeof this.floatWinInstance.hide === 'function') {
                this.floatWinInstance.hide();
            }
          } catch(e) { 
            console.log("关闭窗口异常(可忽略):", e);
          }
        }
        this.isPetShown = false;
        this.addLog("👻 寄生兽已收回");
      } else {
        this.showFloatWindow();
      }
    },

    // pages/index/index.vue
    
    showFloatWindow() {
      try {
        const rawPath = '/static/pet.html';
        const absolutePath = plus.io.convertLocalFileSystemURL(rawPath);
        
        // 1. 实例化 (如果不存在)
        if (!this.floatWinInstance) {
          this.floatWinInstance = new FloatWindow();
        }
    
        // 2. 设置加载的 URL
        // 文档 API: loadUrl(url)
        this.floatWinInstance.loadUrl(absolutePath);
    
        // 3. 设置宽高 (必须先转为 Android 像素)
        // 文档 API: setFixedWidthHeight(enable, width, height)
        // 文档 API: convertHtmlPxToAndroidPx(px)
        const w = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        const h = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        this.floatWinInstance.setFixedWidthHeight(true, w, h);
    
        // 4. 设置位置 (坐标 x=200, y=300)
        // 文档 API: setLocation(x, y) 
        // 注意：如果想用 Gravity (如居中) 可以改用 setGravity
        const x = this.floatWinInstance.convertHtmlPxToAndroidPx(200);
        const y = this.floatWinInstance.convertHtmlPxToAndroidPx(300);
        this.floatWinInstance.setLocation(x, y);
    
        // 5. 🔥【核心】设置显示模式：全局一直显示
        // 文档 API: setShowPattern(pattern) -> 3 代表全局
        this.floatWinInstance.setShowPattern(3);
    
        // 6. 开启拖拽 (对应你之前的 moveable)
        // 文档 API: setDragEnable(enable)
        this.floatWinInstance.setDragEnable(true);
        
        // 7. 最终创建并显示
        // 文档 API: createAndShow()
        this.floatWinInstance.createAndShow();
    
        this.isPetShown = true;
        this.addLog("✅ 寄生兽已召唤 (全局模式)");
      } catch (e) {
        console.error(e);
        this.addLog("❌ 插件调用异常: " + e.message);
      }
    },

    // --- 3. 监控 (彻底修复 size is not a function) ---
    toggleMonitor() {
      this.checkPermissions();
      if (!this.hasUsagePermission) {
        this.addLog("❌ 缺监控权限");
        this.requestPermission('usage');
        return;
      }

      if (this.isMonitoring) {
        clearInterval(this.monitorInterval);
        this.isMonitoring = false;
        this.addLog("⏹ 监控已停止");
      } else {
        this.isMonitoring = true;
        this.addLog("👁 全域监控启动...");
        this.checkCurrentApp();
        this.monitorInterval = setInterval(() => {
          this.checkCurrentApp();
        }, 3000);
      }
    },

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

        // 获取 Java List 对象
        const statsList = manager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startTime, endTime);
        
        // 🔥【核心修复】使用 plus.android.invoke 暴力调用 size()，避开 Native.js 映射 bug
        const size = plus.android.invoke(statsList, "size");
        
        if (size > 0) {
          let currentPackage = "";
          let lastTime = 0;

          // 遍历 List
          for (let i = 0; i < size; i++) {
            // 🔥【核心修复】使用 invoke 暴力调用 get(i)
            const stats = plus.android.invoke(statsList, "get", i);
            
            // 获取时间
            const timeObj = plus.android.invoke(stats, "getLastTimeUsed");
            // 获取包名
            const pkgObj = plus.android.invoke(stats, "getPackageName");

            if (timeObj > lastTime) {
              lastTime = timeObj;
              currentPackage = pkgObj;
            }
          }

          if (currentPackage) {
            // 过滤桌面应用
            if (currentPackage.indexOf("launcher") === -1 && currentPackage.indexOf("home") === -1) {
              if (this.lastPackage !== currentPackage) {
                this.addLog("🔎 检测到: " + currentPackage);
                this.lastPackage = currentPackage;
              }
            }
          }
        }
      } catch (e) {
        // 这里的报错通常可以忽略，不影响下次运行
        console.log("Monitor tick error:", e); 
      }
    }
  }
}
</script>

<style lang="scss">
.container { padding: 20px; background: #121212; min-height: 100vh; color: #fff; }
.header { text-align: center; margin: 30px 0; }
.logo { width: 60px; height: 60px; }
.title { font-size: 20px; color: #00e676; font-weight: bold; }
.subtitle { color: #666; font-size: 12px; }

.card { background: #1e1e1e; padding: 15px; border-radius: 10px; margin-bottom: 20px; }
.card-header { border-left: 3px solid #00e676; padding-left: 10px; font-weight: bold; margin-bottom: 15px; }

.status-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
.t-green { color: #00e676; margin-left: 5px; }
.t-red { color: #ff4444; margin-left: 5px; }

.btn-group { display: flex; flex-direction: column; gap: 10px; }
.btn { background: transparent; color: #fff; border: 1px solid #333; }
.btn.primary { background: #00e676; color: #000; border: none; }
.btn.warning { background: #ff4444; border: none; }

.log-box { background: #000; border: 1px solid #333; border-radius: 8px; padding: 10px; height: 200px; display: flex; flex-direction: column; }
.log-header { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 5px; }
.log-scroll { flex: 1; height: 0; }
.log-text { font-family: monospace; font-size: 11px; color: #0f0; line-height: 1.4; }
</style>

