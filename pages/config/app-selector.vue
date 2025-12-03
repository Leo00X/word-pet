<template>
  <view class="selector-container">
    <view class="search-bar">
      <input 
        class="search-input" 
        type="text" 
        v-model="keyword" 
        placeholder="搜索应用名称或包名..." 
        placeholder-style="color: #57606f;"
      />
      <view class="scan-btn" @click="forceRescan">
        <text class="scan-icon">🔄</text>
      </view>
    </view>

    <view class="progress-box" v-if="loading">
        <text class="progress-text">正在深度扫描: {{ progress }}%</text>
        <progress :percent="progress" stroke-width="3" activeColor="#2ed573" backgroundColor="#2f3542"/>
    </view>

    <scroll-view scroll-y="true" class="list-scroll">
      <view v-if="!loading && filteredList.length === 0" class="empty-tips">
        未找到应用，请点击右上角刷新
      </view>

      <view 
        v-else
        class="app-item" 
        v-for="(item, index) in filteredList" 
        :key="item.package"
        @click="toggleSelect(item)"
      >
        <view class="app-info">
          <text class="app-name">{{ item.name }}</text>
          <text class="app-pkg">{{ item.package }}</text>
          <text class="sys-tag" v-if="item.isSystem">系统</text>
        </view>
        
        <view class="checkbox" :class="{ checked: isSelected(item.package) }">
          <text v-if="isSelected(item.package)">✓</text>
        </view>
      </view>
    </scroll-view>

    <view class="footer">
      <view class="count-info">已选: {{ selectedPackages.length }} 个</view>
      <button class="save-btn" @click="saveAndExit">保存设置</button>
    </view>
  </view>
</template>

<script>
import { getInstalledApps } from '@/utils/appTool.js';

// 定义缓存的 Key，区分于黑白名单
const CACHE_KEY_ALL_APPS = 'sys_installed_apps_cache';

export default {
  data() {
    return {
      mode: 'whitelist',
      allApps: [],
      keyword: '',
      loading: false, // 默认为 false，由逻辑控制是否开启
      progress: 0,
      selectedPackages: [] 
    };
  },
  computed: {
    filteredList() {
      if (!this.keyword) return this.allApps;
      const key = this.keyword.toLowerCase();
      // 性能优化：搜索结果过多时只显示前 100 个
      return this.allApps.filter(app => 
        app.name.toLowerCase().includes(key) || 
        app.package.toLowerCase().includes(key)
      ).slice(0, 100); 
    }
  },
  onLoad(options) {
    this.mode = options.mode || 'whitelist';
    uni.setNavigationBarTitle({
      title: this.mode === 'whitelist' ? '添加食物 (学习)' : '添加毒药 (娱乐)'
    });
    
    // 1. 读取已勾选的数据 (回显)
    const storageKey = this.mode === 'whitelist' ? 'pet_whitelist' : 'pet_blacklist';
    this.selectedPackages = uni.getStorageSync(storageKey) || [];

    // 2. 尝试读取应用列表缓存
    const cachedApps = uni.getStorageSync(CACHE_KEY_ALL_APPS);
    if (cachedApps && cachedApps.length > 0) {
        console.log("加载缓存的应用列表，数量:", cachedApps.length);
        this.allApps = cachedApps;
        this.loading = false;
        // 既然有缓存，就不需要 onReady 再扫描了
    } else {
        // 没有缓存，标记为需要扫描
        this.needScan = true;
    }
  },
  onReady() {
      // 只有在没有缓存的情况下，才在页面渲染完成后自动开始扫描
      if (this.needScan) {
          setTimeout(() => {
              this.startScan();
          }, 300);
      }
  },
  methods: {
    // 强制重新扫描 (右上角按钮)
    forceRescan() {
        this.allApps = []; // 清空列表
        this.startScan();
    },

    async startScan() {
      if (this.loading) return; // 防止重复点击
      this.loading = true;
      this.progress = 0;
      
      try {
        // 传入回调更新进度
        const apps = await getInstalledApps((percent) => {
            this.progress = percent;
        });
        
        // 排序：已选的排前面
        this.allApps = this.sortApps(apps);
        
        // 🔥 核心修改：扫描完成后，写入缓存
        uni.setStorageSync(CACHE_KEY_ALL_APPS, this.allApps);
        
      } catch (e) {
        uni.showToast({ title: '扫描出错', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    sortApps(apps) {
        return apps.sort((a, b) => {
            const aSelected = this.isSelected(a.package);
            const bSelected = this.isSelected(b.package);
            // 选中的排前面
            return (bSelected ? 1 : 0) - (aSelected ? 1 : 0);
        });
    },

    isSelected(pkg) { return this.selectedPackages.includes(pkg); },
    
    toggleSelect(item) {
      const idx = this.selectedPackages.indexOf(item.package);
      if (idx > -1) this.selectedPackages.splice(idx, 1);
      else this.selectedPackages.push(item.package);
    },

    saveAndExit() {
      const key = this.mode === 'whitelist' ? 'pet_whitelist' : 'pet_blacklist';
      uni.setStorageSync(key, this.selectedPackages);
      uni.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 800);
    }
  }
}
</script>

<style lang="scss">
.selector-container { background-color: #1a1a2e; height: 100vh; display: flex; flex-direction: column; color: #f1f2f6; }

/* 搜索栏改为 Flex 布局以容纳按钮 */
.search-bar { 
    padding: 10px 15px; 
    background: #16213e; 
    display: flex; 
    align-items: center; 
    gap: 10px; 
}
.search-input { 
    flex: 1; 
    background: #0f1526; 
    color: #fff; 
    padding: 8px; 
    border-radius: 6px; 
    font-size: 14px; 
    border: 1px solid #2f3542; 
}
/* 扫描按钮样式 */
.scan-btn {
    width: 36px;
    height: 36px;
    background: #2f3542;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #57606f;
}
.scan-btn:active { background: #57606f; }
.scan-icon { font-size: 18px; }

.progress-box { padding: 10px 15px; background: #16213e; border-bottom: 1px solid #2f3542; }
.progress-text { font-size: 12px; color: #2ed573; margin-bottom: 5px; display: block; text-align: center; }

.list-scroll { flex: 1; height: 0; }
.empty-tips { text-align: center; padding: 30px; color: #747d8c; }

.app-item { display: flex; align-items: center; padding: 12px 15px; border-bottom: 1px solid #2f3542; }
.app-info { flex: 1; margin-right: 10px; display: flex; flex-direction: column; }
.app-name { font-size: 14px; font-weight: bold; color: #dfe4ea; }
.app-pkg { font-size: 12px; color: #747d8c; }
.sys-tag { font-size: 10px; background: #2f3542; color: #a4b0be; padding: 1px 4px; border-radius: 3px; width: fit-content; margin-top: 2px; }

.checkbox { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #57606f; display: flex; align-items: center; justify-content: center; color: #000; font-size: 12px; }
.checkbox.checked { background: #2ed573; border-color: #2ed573; }

.footer { padding: 10px 15px; background: #16213e; border-top: 1px solid #2f3542; display: flex; align-items: center; justify-content: space-between; }
.count-info { color: #2ed573; font-weight: bold; }
.save-btn { background: #3742fa; color: #fff; font-size: 14px; padding: 0 20px; height: 32px; line-height: 32px; border-radius: 16px; }
</style>