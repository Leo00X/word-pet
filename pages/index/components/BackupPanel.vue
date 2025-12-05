<template>
  <view class="backup-panel">
    <!-- 头部 -->
    <view class="panel-header">
      <text class="header-title">☁️ 数据备份</text>
      <text class="header-subtitle">保护你的游戏进度</text>
    </view>

    <!-- 同步状态卡片 -->
    <view class="sync-status-card">
      <view class="status-icon" :class="syncStatusClass">
        <text>{{ syncStatusIcon }}</text>
      </view>
      <view class="status-info">
        <text class="status-text">{{ syncStatusText }}</text>
        <text class="last-sync">上次同步: {{ lastSyncTimeFormatted }}</text>
      </view>
    </view>

    <!-- 数据摘要 -->
    <view class="data-summary">
      <text class="summary-title">📊 数据摘要</text>
      <view class="summary-items">
        <view class="summary-item">
          <text class="item-label">存档项目</text>
          <text class="item-value">{{ dataSummary.itemCount }} 项</text>
        </view>
        <view class="summary-item">
          <text class="item-label">数据大小</text>
          <text class="item-value">{{ formattedSize }}</text>
        </view>
      </view>
    </view>

    <!-- 本地备份 -->
    <view class="section">
      <text class="section-title">💾 本地备份</text>
      
      <view class="action-row">
        <button class="action-btn export-btn" @tap="handleExport">
          <text class="btn-icon">📤</text>
          <text class="btn-text">导出数据</text>
        </button>
        
        <button class="action-btn import-btn" @tap="handleImport">
          <text class="btn-icon">📥</text>
          <text class="btn-text">导入数据</text>
        </button>
      </view>
      
      <text class="section-hint">导出后保存到本地，可随时恢复</text>
    </view>

    <!-- 云同步（预留） -->
    <view class="section cloud-section">
      <text class="section-title">☁️ 云端同步</text>
      
      <view class="cloud-status" v-if="!cloudEnabled">
        <text class="cloud-icon">🔒</text>
        <text class="cloud-text">云服务未开通</text>
        <text class="cloud-hint">配置 uniCloud 后可启用</text>
      </view>
      
      <view class="action-row" v-else>
        <button class="action-btn cloud-btn" @tap="handleCloudSync">
          <text class="btn-icon">⬆️</text>
          <text class="btn-text">上传到云端</text>
        </button>
        
        <button class="action-btn cloud-btn" @tap="handleCloudRestore">
          <text class="btn-icon">⬇️</text>
          <text class="btn-text">从云端恢复</text>
        </button>
      </view>
    </view>

    <!-- 危险区域 -->
    <view class="section danger-section">
      <text class="section-title">⚠️ 危险操作</text>
      
      <button class="action-btn danger-btn" @tap="handleClearAll">
        <text class="btn-icon">🗑️</text>
        <text class="btn-text">清除所有数据</text>
      </button>
      
      <text class="section-hint danger-hint">
        此操作将删除所有本地数据，不可恢复！
      </text>
    </view>

    <!-- 导入进度 -->
    <view class="progress-overlay" v-if="isProcessing">
      <view class="progress-card">
        <text class="progress-icon">⏳</text>
        <text class="progress-text">{{ processText }}</text>
        <progress :percent="processProgress" stroke-width="4" activeColor="#00d9ff" />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BackupPanel',
  
  props: {
    cloudSync: {
      type: Object,
      default: null
    }
  },

  data() {
    return {
      isProcessing: false,
      processText: '',
      processProgress: 0,
      dataSummary: {
        itemCount: 0,
        totalSize: 0,
        keys: []
      }
    };
  },

  computed: {
    cloudEnabled() {
      return this.cloudSync?.cloudEnabled?.value || false;
    },
    
    syncStatus() {
      return this.cloudSync?.syncStatus?.value || 'idle';
    },
    
    syncStatusText() {
      return this.cloudSync?.syncStatusText?.value || '点击同步';
    },
    
    lastSyncTimeFormatted() {
      return this.cloudSync?.lastSyncTimeFormatted?.value || '从未同步';
    },
    
    syncStatusClass() {
      const status = this.syncStatus;
      return {
        'success': status === 'success',
        'error': status === 'error',
        'syncing': status === 'syncing'
      };
    },
    
    syncStatusIcon() {
      switch (this.syncStatus) {
        case 'syncing': return '🔄';
        case 'success': return '✅';
        case 'error': return '❌';
        default: return '💾';
      }
    },
    
    formattedSize() {
      const bytes = this.dataSummary.totalSize;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  },

  mounted() {
    this.refreshSummary();
  },

  methods: {
    /**
     * 刷新数据摘要
     */
    refreshSummary() {
      if (this.cloudSync) {
        this.dataSummary = this.cloudSync.getDataSummary();
      }
    },

    /**
     * 导出数据
     */
    async handleExport() {
      this.isProcessing = true;
      this.processText = '正在导出...';
      this.processProgress = 0;

      try {
        // 模拟进度
        const progressInterval = setInterval(() => {
          if (this.processProgress < 80) {
            this.processProgress += 10;
          }
        }, 100);

        const filePath = await this.cloudSync.exportToFile();
        
        clearInterval(progressInterval);
        this.processProgress = 100;

        setTimeout(() => {
          this.isProcessing = false;
          uni.showToast({
            title: '导出成功！',
            icon: 'success'
          });
        }, 500);

      } catch (err) {
        this.isProcessing = false;
        uni.showToast({
          title: '导出失败',
          icon: 'error'
        });
      }
    },

    /**
     * 导入数据
     */
    async handleImport() {
      uni.showModal({
        title: '确认导入',
        content: '导入将覆盖当前数据，确定继续？',
        confirmColor: '#00d9ff',
        success: async (res) => {
          if (!res.confirm) return;

          this.isProcessing = true;
          this.processText = '正在导入...';
          this.processProgress = 0;

          try {
            const count = await this.cloudSync.importFromFile();
            this.processProgress = 100;

            setTimeout(() => {
              this.isProcessing = false;
              this.refreshSummary();
              
              uni.showModal({
                title: '导入成功',
                content: `已恢复 ${count} 项数据，需要重启应用生效`,
                showCancel: false,
                confirmText: '知道了'
              });
            }, 500);

          } catch (err) {
            this.isProcessing = false;
            uni.showToast({
              title: '导入失败: ' + err.message,
              icon: 'none'
            });
          }
        }
      });
    },

    /**
     * 云端同步
     */
    async handleCloudSync() {
      if (!this.cloudEnabled) {
        uni.showToast({ title: '云服务未开通', icon: 'none' });
        return;
      }

      this.isProcessing = true;
      this.processText = '正在上传...';

      try {
        await this.cloudSync.syncToCloud();
        this.isProcessing = false;
        this.refreshSummary();
        uni.showToast({ title: '上传成功！', icon: 'success' });
      } catch (err) {
        this.isProcessing = false;
        uni.showToast({ title: '上传失败', icon: 'error' });
      }
    },

    /**
     * 云端恢复
     */
    async handleCloudRestore() {
      if (!this.cloudEnabled) {
        uni.showToast({ title: '云服务未开通', icon: 'none' });
        return;
      }

      uni.showModal({
        title: '确认恢复',
        content: '将从云端恢复数据，覆盖本地，确定？',
        confirmColor: '#ff4757',
        success: async (res) => {
          if (!res.confirm) return;

          this.isProcessing = true;
          this.processText = '正在恢复...';

          try {
            await this.cloudSync.restoreFromCloud();
            this.isProcessing = false;
            this.refreshSummary();
            uni.showToast({ title: '恢复成功！', icon: 'success' });
          } catch (err) {
            this.isProcessing = false;
            uni.showToast({ title: '恢复失败', icon: 'error' });
          }
        }
      });
    },

    /**
     * 清除所有数据
     */
    handleClearAll() {
      uni.showModal({
        title: '⚠️ 危险操作',
        content: '确定要删除所有本地数据吗？此操作无法撤销！',
        confirmColor: '#ff4757',
        confirmText: '确认删除',
        success: (res) => {
          if (!res.confirm) return;

          // 二次确认
          uni.showModal({
            title: '最后确认',
            content: '真的要删除吗？所有进度将丢失！',
            confirmColor: '#ff4757',
            confirmText: '删除',
            success: (res2) => {
              if (!res2.confirm) return;

              try {
                uni.clearStorageSync();
                uni.showToast({
                  title: '已清除所有数据',
                  icon: 'success'
                });

                // 刷新应用
                setTimeout(() => {
                  // #ifdef APP-PLUS
                  plus.runtime.restart();
                  // #endif
                  // #ifdef H5
                  location.reload();
                  // #endif
                }, 1500);

              } catch (err) {
                uni.showToast({
                  title: '清除失败',
                  icon: 'error'
                });
              }
            }
          });
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.backup-panel {
  padding: 20px;
  min-height: 100%;
  background: #0a0f1a;
}

/* 头部 */
.panel-header {
  margin-bottom: 20px;
}

.header-title {
  font-size: 20px;
  font-weight: bold;
  color: #00d9ff;
  display: block;
}

.header-subtitle {
  font-size: 12px;
  color: #747d8c;
  margin-top: 4px;
  display: block;
}

/* 同步状态卡片 */
.sync-status-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #2f3542;
}

.status-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #2f3542;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.status-icon.success {
  background: rgba(46, 213, 115, 0.2);
}

.status-icon.error {
  background: rgba(255, 71, 87, 0.2);
}

.status-icon.syncing {
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  display: block;
}

.last-sync {
  font-size: 11px;
  color: #747d8c;
  margin-top: 3px;
  display: block;
}

/* 数据摘要 */
.data-summary {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #2f3542;
}

.summary-title {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
  display: block;
}

.summary-items {
  display: flex;
  gap: 20px;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.item-label {
  font-size: 11px;
  color: #747d8c;
  display: block;
}

.item-value {
  font-size: 18px;
  font-weight: bold;
  color: #00d9ff;
  font-family: monospace;
  display: block;
  margin-top: 4px;
}

/* 分区 */
.section {
  background: #1a1a2e;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  border: 1px solid #2f3542;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
  display: block;
}

.section-hint {
  font-size: 11px;
  color: #747d8c;
  margin-top: 10px;
  display: block;
}

.danger-hint {
  color: #ff6b6b;
}

/* 操作按钮 */
.action-row {
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-radius: 10px;
  border: none;
  background: #2f3542;
  transition: all 0.3s;
}

.action-btn:active {
  transform: scale(0.98);
}

.btn-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.btn-text {
  font-size: 12px;
  color: #a4b0be;
}

.export-btn {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(0, 180, 216, 0.2));
  border: 1px solid rgba(0, 217, 255, 0.3);
}

.import-btn {
  background: linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(0, 255, 136, 0.2));
  border: 1px solid rgba(46, 213, 115, 0.3);
}

.cloud-btn {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.danger-btn {
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 107, 107, 0.2));
  border: 1px solid rgba(255, 71, 87, 0.3);
}

.danger-section {
  border-color: rgba(255, 71, 87, 0.3);
}

/* 云服务状态 */
.cloud-status {
  text-align: center;
  padding: 20px;
}

.cloud-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

.cloud-text {
  font-size: 14px;
  color: #a4b0be;
  display: block;
}

.cloud-hint {
  font-size: 11px;
  color: #747d8c;
  margin-top: 5px;
  display: block;
}

/* 进度遮罩 */
.progress-overlay {
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

.progress-card {
  width: 250px;
  background: #1a1a2e;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
}

.progress-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 15px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.progress-text {
  font-size: 14px;
  color: #fff;
  margin-bottom: 15px;
  display: block;
}
</style>
