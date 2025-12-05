<template>
  <view class="achievement-panel">
    <!-- 进度头部 -->
    <view class="progress-header">
      <text class="header-title">🏆 成就系统</text>
      <view class="progress-info">
        <text class="progress-text">{{ progress.unlocked }}/{{ progress.total }}</text>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress.percent + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 分类标签 -->
    <view class="category-tabs">
      <view 
        v-for="(cat, key) in categories" 
        :key="key"
        class="tab-item"
        :class="{ active: currentCategory === key }"
        @tap="currentCategory = key"
      >
        <text>{{ cat.icon }} {{ cat.name }}</text>
      </view>
    </view>

    <!-- 成就列表 -->
    <scroll-view class="achievement-list" scroll-y>
      <view 
        v-for="achievement in filteredAchievements" 
        :key="achievement.id"
        class="achievement-item"
        :class="{ unlocked: achievement.unlocked, locked: !achievement.unlocked }"
      >
        <view class="achievement-icon">
          <text>{{ achievement.unlocked ? achievement.icon : '🔒' }}</text>
        </view>
        <view class="achievement-info">
          <text class="achievement-name">{{ achievement.name }}</text>
          <text class="achievement-desc">{{ achievement.description }}</text>
          <view class="achievement-reward" v-if="achievement.unlocked">
            <text>🪙 +{{ achievement.reward.coins }}</text>
            <text>⭐ +{{ achievement.reward.exp }}</text>
          </view>
        </view>
        <view class="achievement-status">
          <text v-if="achievement.unlocked" class="status-unlocked">✓</text>
        </view>
      </view>

      <view v-if="filteredAchievements.length === 0" class="empty-state">
        <text>暂无成就</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { CATEGORIES } from '../utils/achievementList.js';

export default {
  name: 'AchievementPanel',
  props: {
    achievements: {
      type: Array,
      default: () => []
    },
    progress: {
      type: Object,
      default: () => ({ unlocked: 0, total: 0, percent: 0 })
    }
  },
  
  data() {
    return {
      currentCategory: 'study',
      categories: CATEGORIES
    };
  },
  
  computed: {
    filteredAchievements() {
      return this.achievements.filter(a => a.category === this.currentCategory);
    }
  }
}
</script>

<style lang="scss" scoped>
$bg-dark: #1a1a2e;
$accent-gold: #ffd700;
$accent-cyan: #00d9ff;
$text-dim: #747d8c;

.achievement-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  margin-bottom: 12px;
}

.header-title {
  font-size: 16px;
  font-weight: bold;
  color: $accent-gold;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 14px;
  color: #dfe4ea;
}

.progress-bar {
  width: 80px;
  height: 8px;
  background: #2f3542;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $accent-gold, #ffaa00);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.tab-item {
  flex: 1;
  padding: 8px;
  text-align: center;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  font-size: 12px;
  color: $text-dim;
  transition: all 0.2s;
  
  &.active {
    background: rgba($accent-cyan, 0.2);
    color: $accent-cyan;
  }
}

.achievement-list {
  flex: 1;
  max-height: 280px;
}

.achievement-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s;
  
  &.unlocked {
    background: rgba($accent-gold, 0.1);
    border: 1px solid rgba($accent-gold, 0.3);
  }
  
  &.locked {
    opacity: 0.6;
  }
}

.achievement-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(0,0,0,0.3);
  border-radius: 8px;
  margin-right: 12px;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #dfe4ea;
  margin-bottom: 2px;
}

.achievement-desc {
  display: block;
  font-size: 11px;
  color: $text-dim;
}

.achievement-reward {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 11px;
  color: $accent-gold;
}

.achievement-status {
  width: 30px;
  text-align: center;
}

.status-unlocked {
  color: #2ed573;
  font-size: 18px;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: $text-dim;
}
</style>
