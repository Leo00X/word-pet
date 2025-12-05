<template>
  <view class="skin-selector">
    <!-- 标题栏 -->
    <view class="header">
      <text class="title">🎨 皮肤管理</text>
      <text class="subtitle">已解锁 {{ unlockedCount }}/{{ totalCount }}</text>
    </view>

    <!-- 当前皮肤预览 -->
    <view class="current-preview">
      <view class="preview-card" :style="{ borderColor: currentSkin.styles.primaryColor }">
        <text class="preview-emoji">{{ getCurrentEmoji() }}</text>
        <view class="preview-info">
          <text class="preview-name">{{ currentSkin.name }}</text>
          <text class="preview-desc">{{ currentSkin.description }}</text>
        </view>
        <view class="current-badge">使用中</view>
      </view>
    </view>

    <!-- 皮肤列表 -->
    <view class="skins-grid">
      <view 
        v-for="skin in allSkinsWithStatus" 
        :key="skin.id"
        class="skin-card"
        :class="{
          'unlocked': skin.isUnlocked,
          'locked': !skin.isUnlocked,
          'active': skin.isActive
        }"
        @tap="handleSkinTap(skin)"
      >
        <!-- 预览图 -->
        <view class="skin-preview" :style="{ background: getPreviewBackground(skin) }">
          <text class="skin-emoji">{{ getSkinEmoji(skin) }}</text>
          
          <!-- 锁定图标 -->
          <view v-if="!skin.isUnlocked" class="lock-overlay">
            <text class="lock-icon">🔒</text>
          </view>
          
          <!-- 当前选中标识 -->
          <view v-if="skin.isActive" class="active-badge">
            <text>✓</text>
          </view>
        </view>

        <!-- 皮肤信息 -->
        <view class="skin-info">
          <text class="skin-name">{{ skin.name }}</text>
          <text v-if="!skin.isUnlocked" class="unlock-hint">
            {{ skin.unlockCondition?.message || '未解锁' }}
          </text>
          <text v-else class="skin-author">by {{ skin.author }}</text>
        </view>
      </view>
    </view>

    <!-- 在线皮肤区域（Phase 3） -->
    <view class="online-section" v-if="showOnlineSection">
      <view class="section-header">
        <text class="section-title">🌐 在线皮肤</text>
        <text class="section-action" @tap="refreshOnlineSkins">刷新</text>
      </view>
      
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>
      
      <view v-else-if="onlineSkins.length === 0" class="empty">
        <text>暂无在线皮肤</text>
      </view>
      
      <view v-else class="online-list">
        <view 
          v-for="skin in onlineSkins" 
          :key="skin.id"
          class="online-card"
          @tap="handleDownload(skin)"
        >
          <text class="online-name">{{ skin.name }}</text>
          <view v-if="downloadProgress[skin.id] !== undefined" class="download-progress">
            <progress :percent="downloadProgress[skin.id]" stroke-width="4" />
          </view>
          <text v-else class="download-btn">下载</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { PET_TYPES } from '../utils/petForms.js';

export default {
  name: 'SkinSelector',
  
  props: {
    // 从 useSkins 传入的数据
    currentSkin: {
      type: Object,
      required: true
    },
    allSkinsWithStatus: {
      type: Array,
      required: true
    },
    onlineSkins: {
      type: Array,
      default: () => []
    },
    downloadProgress: {
      type: Object,
      default: () => ({})
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    showOnlineSection: {
      type: Boolean,
      default: false // Phase 3 开启
    }
  },

  computed: {
    unlockedCount() {
      return this.allSkinsWithStatus.filter(s => s.isUnlocked).length;
    },
    totalCount() {
      return this.allSkinsWithStatus.length;
    }
  },

  methods: {
    /**
     * 获取当前皮肤的emoji
     */
    getCurrentEmoji() {
      const petType = this.currentSkin.petType;
      const typeConfig = Object.values(PET_TYPES).find(t => t.id === petType);
      return typeConfig?.emoji || '👻';
    },

    /**
     * 获取皮肤预览emoji
     */
    getSkinEmoji(skin) {
      // 优先使用皮肤自带的emoji（商城购买的皮肤）
      if (skin.emoji) {
        return skin.emoji;
      }
      // 否则根据petType查找
      const petType = skin.petType;
      const typeConfig = Object.values(PET_TYPES).find(t => t.id === petType);
      return typeConfig?.emoji || '👻';
    },

    /**
     * 获取预览背景
     */
    getPreviewBackground(skin) {
      const primary = skin.styles?.primaryColor || '#00d9ff';
      const secondary = skin.styles?.secondaryColor || '#ff66cc';
      return `linear-gradient(135deg, ${primary}22, ${secondary}22)`;
    },

    /**
     * 点击皮肤卡片
     */
    handleSkinTap(skin) {
      if (!skin.isUnlocked) {
        uni.showToast({ 
          title: skin.unlockCondition?.message || '未解锁', 
          icon: 'none' 
        });
        return;
      }

      if (skin.isActive) {
        uni.showToast({ title: '当前已使用', icon: 'none' });
        return;
      }

      this.$emit('select', skin.id);
    },

    /**
     * 刷新在线皮肤
     */
    refreshOnlineSkins() {
      this.$emit('refresh-online');
    },

    /**
     * 下载皮肤
     */
    handleDownload(skin) {
      this.$emit('download', skin.id);
    }
  }
};
</script>

<style lang="scss" scoped>
.skin-selector {
  height: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #0a0f1a;
  overflow: hidden;
}

/* 标题栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px 15px 10px;
  border-bottom: 1px solid #2f3542;
  flex-shrink: 0;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #00d9ff;
}

.subtitle {
  font-size: 12px;
  color: #747d8c;
}

/* 当前皮肤预览 */
.current-preview {
  margin-bottom: 15px;
  padding: 0 15px;
  flex-shrink: 0;
}

.preview-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 12px;
  border: 2px solid;
  position: relative;
}

.preview-emoji {
  font-size: 50px;
  margin-right: 15px;
  filter: drop-shadow(0 0 10px rgba(0, 217, 255, 0.5));
}

.preview-info {
  flex: 1;
}

.preview-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 5px;
}

.preview-desc {
  font-size: 12px;
  color: #a4b0be;
  display: block;
}

.current-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #00d9ff;
  color: #000;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: bold;
}

/* 皮肤网格 - 可滚动区域 */
.skins-grid {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-content: flex-start;
}

.skin-card {
  width: calc(50% - 6px);
  background: #1a1a2e;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.skin-card.unlocked {
  border-color: #2f3542;
}

.skin-card.unlocked:active {
  transform: scale(0.98);
  border-color: #00d9ff;
}

.skin-card.active {
  border-color: #00d9ff;
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.3);
}

.skin-card.locked {
  opacity: 0.6;
  border-color: #2f3542;
}

/* 皮肤预览区 */
.skin-preview {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.skin-emoji {
  font-size: 45px;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon {
  font-size: 24px;
}

.active-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: #00d9ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-badge text {
  font-size: 12px;
  color: #000;
  font-weight: bold;
}

/* 皮肤信息 */
.skin-info {
  padding: 10px;
  background: #16213e;
}

.skin-name {
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 3px;
}

.unlock-hint {
  font-size: 10px;
  color: #ff6b6b;
  display: block;
}

.skin-author {
  font-size: 10px;
  color: #747d8c;
  display: block;
}

/* 在线皮肤区域 */
.online-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #2f3542;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #00d9ff;
}

.section-action {
  font-size: 12px;
  color: #747d8c;
}

.loading,
.empty {
  text-align: center;
  padding: 20px;
  color: #747d8c;
}

.online-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.online-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #1a1a2e;
  border-radius: 8px;
}

.online-name {
  font-size: 13px;
  color: #fff;
}

.download-btn {
  font-size: 12px;
  color: #00d9ff;
  padding: 5px 12px;
  border: 1px solid #00d9ff;
  border-radius: 15px;
}

.download-progress {
  width: 80px;
}
</style>
