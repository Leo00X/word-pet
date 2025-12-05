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
          <!-- 显示自定义名称（如有） -->
          <text class="app-name">
            {{ getCustomName(item.package) || item.name }}
            <text class="custom-tag" v-if="getCustomName(item.package)">自定义</text>
          </text>
          <!-- 显示备注（如有） -->
          <text class="app-note" v-if="getCustomNote(item.package)">
            📝 {{ getCustomNote(item.package) }}
          </text>
          <text class="app-pkg">{{ item.package }}</text>
          <text class="sys-tag" v-if="item.isSystem">系统</text>
        </view>
        
        <view class="action-btns">
          <!-- 编辑按钮 -->
          <view class="edit-btn" v-if="isSelected(item.package)" @click.stop="editApp(item)">
            ✏️
          </view>
          <!-- 勾选框 -->
          <view class="checkbox" :class="{ checked: isSelected(item.package) }">
            <text v-if="isSelected(item.package)">✓</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer">
      <view class="count-info">已选: {{ selectedCount }} 个</view>
      <button class="save-btn" @click="saveAndExit">保存设置</button>
    </view>
    
    <!-- 编辑弹窗 -->
    <view class="edit-modal" v-if="showEditModal" @click="showEditModal = false">
      <view class="edit-content" @click.stop>
        <text class="edit-title">编辑应用信息</text>
        <text class="edit-pkg">{{ editingApp?.package }}</text>
        
        <view class="edit-field">
          <text class="field-label">自定义名称</text>
          <input 
            class="field-input" 
            v-model="editForm.customName" 
            placeholder="AI能理解的名称，如 '微信读书'"
            placeholder-style="color: #57606f;"
          />
        </view>
        
        <view class="edit-field">
          <text class="field-label">备注说明</text>
          <input 
            class="field-input" 
            v-model="editForm.note" 
            placeholder="这是什么类型的软件，如 '电子书阅读'"
            placeholder-style="color: #57606f;"
          />
        </view>
        
        <view class="edit-actions">
          <button class="cancel-btn" @click="showEditModal = false">取消</button>
          <button class="confirm-btn" @click="saveEdit">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getInstalledApps } from '@/utils/appTool.js';

// 缓存 Key
const CACHE_KEY_ALL_APPS = 'sys_installed_apps_cache';
// 应用元数据存储 Key（名称、备注）
const APP_METADATA_KEY = 'pet_app_metadata';

export default {
  data() {
    return {
      mode: 'whitelist',
      allApps: [],
      keyword: '',
      loading: false,
      progress: 0,
      selectedPackages: [],  // 兼容旧数据格式
      appMetadata: {},       // 新增：存储自定义名称和备注 { package: { customName, note } }
      showEditModal: false,
      editingApp: null,
      editForm: {
        customName: '',
        note: ''
      }
    };
  },
  computed: {
    filteredList() {
      let list = this.allApps;
      
      // 搜索过滤
      if (this.keyword) {
        const key = this.keyword.toLowerCase();
        list = list.filter(app => 
          app.name.toLowerCase().includes(key) || 
          app.package.toLowerCase().includes(key) ||
          (this.getCustomName(app.package) || '').toLowerCase().includes(key) ||
          (this.getCustomNote(app.package) || '').toLowerCase().includes(key)
        );
      }
      
      // 排序：已选的在前面
      return this.sortApps(list).slice(0, 100);
    },
    
    selectedCount() {
      return this.selectedPackages.length;
    }
  },
  onLoad(options) {
    this.mode = options.mode || 'whitelist';
    uni.setNavigationBarTitle({
      title: this.mode === 'whitelist' ? '🍖 添加食物 (学习)' : '☠️ 添加毒药 (娱乐)'
    });
    
    // 1. 读取应用元数据（名称、备注）
    this.appMetadata = uni.getStorageSync(APP_METADATA_KEY) || {};
    
    // 2. 读取已勾选的数据 (兼容旧格式)
    const storageKey = this.mode === 'whitelist' ? 'pet_whitelist' : 'pet_blacklist';
    const saved = uni.getStorageSync(storageKey) || [];
    
    // 兼容：旧格式是字符串数组，新格式也保持字符串数组（元数据单独存储）
    this.selectedPackages = saved;

    // 3. 读取应用列表缓存
    const cachedApps = uni.getStorageSync(CACHE_KEY_ALL_APPS);
    if (cachedApps && cachedApps.length > 0) {
        console.log("加载缓存的应用列表，数量:", cachedApps.length);
        this.allApps = cachedApps;
        this.loading = false;
    } else {
        this.needScan = true;
    }
  },
  onReady() {
      if (this.needScan) {
          setTimeout(() => {
              this.startScan();
          }, 300);
      }
  },
  methods: {
    forceRescan() {
        this.allApps = [];
        this.startScan();
    },

    async startScan() {
      if (this.loading) return;
      this.loading = true;
      this.progress = 0;
      
      try {
        const apps = await getInstalledApps((percent) => {
            this.progress = percent;
        });
        
        this.allApps = apps;
        uni.setStorageSync(CACHE_KEY_ALL_APPS, this.allApps);
        
      } catch (e) {
        uni.showToast({ title: '扫描出错', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    
    sortApps(apps) {
        // 创建副本避免修改原数组
        return [...apps].sort((a, b) => {
            const aSelected = this.isSelected(a.package) ? 1 : 0;
            const bSelected = this.isSelected(b.package) ? 1 : 0;
            // 选中的排前面
            return bSelected - aSelected;
        });
    },
    
    getCustomName(pkg) {
      return this.appMetadata[pkg]?.customName || '';
    },
    
    getCustomNote(pkg) {
      return this.appMetadata[pkg]?.note || '';
    },

    isSelected(pkg) { 
      return this.selectedPackages.includes(pkg); 
    },
    
    toggleSelect(item) {
      const idx = this.selectedPackages.indexOf(item.package);
      if (idx > -1) {
        this.selectedPackages.splice(idx, 1);
      } else {
        this.selectedPackages.push(item.package);
        // 自动打开编辑弹窗让用户填写信息
        this.editApp(item);
      }
    },
    
    editApp(item) {
      this.editingApp = item;
      this.editForm.customName = this.getCustomName(item.package);
      this.editForm.note = this.getCustomNote(item.package);
      this.showEditModal = true;
    },
    
    saveEdit() {
      if (!this.editingApp) return;
      
      const pkg = this.editingApp.package;
      
      // 更新元数据
      if (this.editForm.customName || this.editForm.note) {
        this.appMetadata[pkg] = {
          customName: this.editForm.customName.trim(),
          note: this.editForm.note.trim()
        };
      } else {
        // 如果都清空了，删除条目
        delete this.appMetadata[pkg];
      }
      
      // 保存元数据
      uni.setStorageSync(APP_METADATA_KEY, this.appMetadata);
      
      this.showEditModal = false;
      uni.showToast({ title: '已保存', icon: 'success' });
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
.app-info { flex: 1; margin-right: 10px; display: flex; flex-direction: column; gap: 2px; }
.app-name { font-size: 14px; font-weight: bold; color: #dfe4ea; display: flex; align-items: center; gap: 6px; }
.custom-tag { font-size: 10px; background: #3742fa; color: #fff; padding: 1px 5px; border-radius: 3px; font-weight: normal; }
.app-note { font-size: 12px; color: #2ed573; }
.app-pkg { font-size: 11px; color: #57606f; }
.sys-tag { font-size: 10px; background: #2f3542; color: #a4b0be; padding: 1px 4px; border-radius: 3px; width: fit-content; }

.action-btns { display: flex; align-items: center; gap: 8px; }
.edit-btn { 
  width: 28px; height: 28px; 
  background: #2f3542; border-radius: 6px; 
  display: flex; align-items: center; justify-content: center; 
  font-size: 14px;
}
.edit-btn:active { background: #57606f; }

.checkbox { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #57606f; display: flex; align-items: center; justify-content: center; color: #000; font-size: 12px; }
.checkbox.checked { background: #2ed573; border-color: #2ed573; }

.footer { padding: 10px 15px; background: #16213e; border-top: 1px solid #2f3542; display: flex; align-items: center; justify-content: space-between; }
.count-info { color: #2ed573; font-weight: bold; }
.save-btn { background: #3742fa; color: #fff; font-size: 14px; padding: 0 20px; height: 32px; line-height: 32px; border-radius: 16px; }

/* 编辑弹窗 */
.edit-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.edit-content {
  width: 85%;
  background: #16213e;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #2f3542;
}
.edit-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 8px;
}
.edit-pkg {
  font-size: 11px;
  color: #57606f;
  display: block;
  margin-bottom: 16px;
}
.edit-field {
  margin-bottom: 16px;
}
.field-label {
  font-size: 12px;
  color: #a4b0be;
  display: block;
  margin-bottom: 6px;
}
.field-input {
  width: 100%;
  background: #0f1526;
  color: #fff;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #2f3542;
  font-size: 14px;
}
.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.cancel-btn {
  flex: 1;
  background: #2f3542;
  color: #a4b0be;
  font-size: 14px;
  height: 36px;
  line-height: 36px;
  border-radius: 8px;
}
.confirm-btn {
  flex: 1;
  background: #2ed573;
  color: #000;
  font-size: 14px;
  font-weight: bold;
  height: 36px;
  line-height: 36px;
  border-radius: 8px;
}
</style>