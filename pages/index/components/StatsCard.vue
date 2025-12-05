<template>
  <view class="stats-card">
    <view class="stats-header">
      <text class="stats-title">📊 今日概览</text>
    </view>
    
    <view class="stats-content">
      <view class="stat-item study">
        <text class="stat-icon">📚</text>
        <view class="stat-info">
          <text class="stat-name">今日学习</text>
          <text class="stat-time">{{ formatMinutes(studyMinutes) }}</text>
        </view>
        <view class="stat-bar-bg">
          <view class="stat-bar-fill" :style="{ width: studyPercent + '%' }"></view>
        </view>
      </view>
      
      <view class="stat-item slack">
        <text class="stat-icon">🐟</text>
        <view class="stat-info">
          <text class="stat-name">今日摸鱼</text>
          <text class="stat-time">{{ formatMinutes(slackMinutes) }}</text>
        </view>
        <view class="stat-bar-bg">
          <view class="stat-bar-fill" :style="{ width: slackPercent + '%' }"></view>
        </view>
      </view>
    </view>
    
    <view class="stats-ratio">
      <text class="ratio-label">学习/摸鱼比: </text>
      <text class="ratio-value" :class="ratioClass">{{ ratioText }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'StatsCard',
  props: {
    studyMinutes: {
      type: Number,
      default: 0
    },
    slackMinutes: {
      type: Number,
      default: 0
    }
  },
  
  computed: {
    studyPercent() {
      const total = this.studyMinutes + this.slackMinutes;
      if (total === 0) return 0;
      return Math.min(100, (this.studyMinutes / 60) * 100);
    },
    
    slackPercent() {
      const total = this.studyMinutes + this.slackMinutes;
      if (total === 0) return 0;
      return Math.min(100, (this.slackMinutes / 60) * 100);
    },
    
    ratioText() {
      if (this.slackMinutes === 0 && this.studyMinutes === 0) return '--';
      if (this.slackMinutes === 0) return '∞';
      return (this.studyMinutes / this.slackMinutes).toFixed(1);
    },
    
    ratioClass() {
      const ratio = this.studyMinutes / (this.slackMinutes || 1);
      if (ratio >= 2) return 'excellent';
      if (ratio >= 1) return 'good';
      if (ratio >= 0.5) return 'warning';
      return 'danger';
    }
  },
  
  methods: {
    formatMinutes(mins) {
      if (mins < 60) return `${mins}分钟`;
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      if (remaining === 0) return `${hours}小时`;
      return `${hours}小时${remaining}分`;
    }
  }
}
</script>

<style lang="scss" scoped>
$bg-dark: #0f1526;
$accent-cyan: #00d9ff;
$accent-green: #2ed573;
$accent-orange: #ff9500;
$accent-red: #ff4757;
$text-light: #e8e8e8;
$text-dim: #6b7280;

.stats-card {
  background: linear-gradient(145deg, rgba($bg-dark, 0.95), rgba(#1a2744, 0.9));
  border: 1px solid rgba($accent-cyan, 0.2);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.stats-header {
  margin-bottom: 14px;
}

.stats-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-light;
}

.stats-content {
  display: flex;
  gap: 12px;
}

.stat-item {
  flex: 1;
  background: rgba(#000, 0.3);
  border-radius: 12px;
  padding: 12px;
  
  &.study {
    border-left: 3px solid $accent-green;
  }
  
  &.slack {
    border-left: 3px solid $accent-orange;
  }
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 8px;
  display: block;
}

.stat-info {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.stat-name {
  font-size: 11px;
  color: $text-dim;
}

.stat-time {
  font-size: 16px;
  font-weight: bold;
  color: $text-light;
  font-family: monospace;
}

.stat-bar-bg {
  height: 4px;
  background: rgba(#fff, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.study .stat-bar-fill {
  background: linear-gradient(90deg, $accent-green, #00ff88);
}

.slack .stat-bar-fill {
  background: linear-gradient(90deg, $accent-orange, #ffcc00);
}

.stats-ratio {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
}

.ratio-label {
  color: $text-dim;
}

.ratio-value {
  font-weight: bold;
  font-family: monospace;
  
  &.excellent { color: $accent-green; }
  &.good { color: $accent-cyan; }
  &.warning { color: $accent-orange; }
  &.danger { color: $accent-red; }
}
</style>
