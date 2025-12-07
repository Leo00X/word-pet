<template>
  <view class="personality-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">🎭 宠物人格</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 主内容 -->
    <scroll-view class="content-scroll" scroll-y>
      <!-- 人格摘要卡片 -->
      <view class="summary-card">
        <view class="pet-avatar">
          <text class="avatar-emoji">{{ petEmoji }}</text>
        </view>
        <view class="summary-info">
          <text class="pet-name">{{ petName }}</text>
          <text class="personality-desc">{{ personalitySummary }}</text>
        </view>
      </view>

      <!-- 雷达图 -->
      <view class="radar-section">
        <text class="section-title">📊 五维人格</text>
        <view class="radar-container">
          <canvas canvas-id="personalityRadar" class="radar-canvas"></canvas>
        </view>
      </view>

      <!-- 人格详情 -->
      <view class="traits-section">
        <text class="section-title">🎯 人格维度</text>
        <view class="trait-card" v-for="(trait, index) in traitsList" :key="index">
          <view class="trait-header">
            <text class="trait-emoji">{{ trait.emoji }}</text>
            <text class="trait-name">{{ trait.name }}</text>
            <text class="trait-value">{{ (trait.value * 100).toFixed(0) }}%</text>
          </view>
          <view class="trait-bar-bg">
            <view class="trait-bar" :style="{ width: (trait.value * 100) + '%', background: trait.gradient }"></view>
          </view>
          <text class="trait-desc">{{ trait.description }}</text>
        </view>
      </view>

      <!-- 演化历史 -->
      <view class="evolution-section">
        <text class="section-title">📈 演化统计</text>
        <view class="stats-grid">
          <view class="stat-card">
            <text class="stat-value">{{ evolutionCount }}</text>
            <text class="stat-label">总演化次数</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ dominantTraitName }}</text>
            <text class="stat-label">主导特质</text>
          </view>
          <view class="stat-card">
            <text class="stat-value">{{ daysSinceCreation }}</text>
            <text class="stat-label">相伴天数</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button class="action-btn primary-btn" @tap="triggerEvolution">
          ✨ 模拟演化
        </button>
        <button class="action-btn danger-btn" @tap="handleReset">
          🔄 重置人格
        </button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { usePersonality } from '../index/composables/usePersonality.js';

// 初始化人格系统
const personality = usePersonality();

// 页面状态
const petName = ref('WordParasite');
const petEmoji = ref('👻');

// 计算属性
const personalitySummary = computed(() => personality.personalitySummary?.value || '性格平衡');
const evolutionCount = computed(() => personality.stats?.value?.evolutionCount || 0);
const dominantTraitName = computed(() => personality.dominantTrait?.value?.name || '未知');

const daysSinceCreation = computed(() => {
  const created = personality.stats?.value?.createdAt;
  if (!created) return 0;
  const days = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
  return days;
});

const traitsList = computed(() => {
  const traits = personality.personality?.value || {};
  return [
    { 
      name: '开放性', 
      key: 'openness', 
      emoji: '🔮', 
      value: traits.openness || 0.5,
      gradient: 'linear-gradient(90deg, #9b59b6, #8e44ad)',
      description: '对新事物的好奇心和接受度'
    },
    { 
      name: '尽责性', 
      key: 'conscientiousness', 
      emoji: '📋', 
      value: traits.conscientiousness || 0.5,
      gradient: 'linear-gradient(90deg, #3498db, #2980b9)',
      description: '做事的认真程度和自律性'
    },
    { 
      name: '外向性', 
      key: 'extraversion', 
      emoji: '🎉', 
      value: traits.extraversion || 0.5,
      gradient: 'linear-gradient(90deg, #f1c40f, #f39c12)',
      description: '社交活跃度和表达欲望'
    },
    { 
      name: '宜人性', 
      key: 'agreeableness', 
      emoji: '💕', 
      value: traits.agreeableness || 0.5,
      gradient: 'linear-gradient(90deg, #2ecc71, #27ae60)',
      description: '对他人的友善和体贴程度'
    },
    { 
      name: '神经质', 
      key: 'neuroticism', 
      emoji: '😤', 
      value: traits.neuroticism || 0.5,
      gradient: 'linear-gradient(90deg, #e74c3c, #c0392b)',
      description: '情绪波动和敏感程度'
    }
  ];
});

// 方法
const goBack = () => {
  uni.navigateBack();
};

const triggerEvolution = () => {
  const events = ['learning_session', 'chat_interaction', 'idle_detected'];
  const randomEvent = events[Math.floor(Math.random() * events.length)];
  personality.evolvePersonality(randomEvent);
  
  uni.showToast({
    title: '人格已演化！',
    icon: 'success'
  });
  
  // 重绘雷达图
  setTimeout(drawRadar, 100);
};

const handleReset = () => {
  uni.showModal({
    title: '重置人格',
    content: '确定要将宠物人格重置为初始状态吗？这将清除所有演化历史。',
    success: (res) => {
      if (res.confirm) {
        personality.resetPersonality();
        uni.showToast({ title: '已重置', icon: 'success' });
        setTimeout(drawRadar, 100);
      }
    }
  });
};

// 绘制雷达图
const drawRadar = () => {
  const ctx = uni.createCanvasContext('personalityRadar');
  // 使用较小的尺寸适配手机屏幕 (500rpx ≈ 250px on 375px width screen)
  const canvasSize = 250;
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  const radius = 80;
  const traits = personality.personality?.value || {};
  const values = [
    traits.openness || 0.5,
    traits.conscientiousness || 0.5,
    traits.extraversion || 0.5,
    traits.agreeableness || 0.5,
    traits.neuroticism || 0.5
  ];
  const angleStep = (Math.PI * 2) / 5;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // 绘制背景网格
  ctx.setStrokeStyle('rgba(0, 255, 255, 0.15)');
  ctx.setLineWidth(1);
  
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    const levelRadius = (radius / 5) * level;
    for (let i = 0; i <= 5; i++) {
      const angle = startAngle + angleStep * i;
      const x = centerX + Math.cos(angle) * levelRadius;
      const y = centerY + Math.sin(angle) * levelRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  ctx.setStrokeStyle('rgba(0, 255, 255, 0.25)');
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.stroke();
  }

  // 绘制数据区域
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    const x = centerX + Math.cos(angle) * (radius * values[i]);
    const y = centerY + Math.sin(angle) * (radius * values[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.setFillStyle('rgba(0, 255, 255, 0.3)');
  ctx.fill();
  ctx.setStrokeStyle('#00ffff');
  ctx.setLineWidth(2);
  ctx.stroke();

  // 绘制数据点
  ctx.setFillStyle('#00ffff');
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    const x = centerX + Math.cos(angle) * (radius * values[i]);
    const y = centerY + Math.sin(angle) * (radius * values[i]);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制标签
  const labels = ['开放性', '尽责性', '外向性', '宜人性', '神经质'];
  ctx.setFillStyle('#ffffff');
  ctx.setFontSize(12);
  ctx.setTextAlign('center');
  
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    const labelRadius = radius + 25;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius + 4;
    ctx.fillText(labels[i], x, y);
  }

  ctx.draw();
};

// 生命周期
onMounted(() => {
  setTimeout(drawRadar, 200);
});

onShow(() => {
  personality.loadData?.();
  setTimeout(drawRadar, 200);
});

// 监听数据变化
watch(() => personality.personality?.value, () => {
  drawRadar();
}, { deep: true });
</script>

<style lang="scss" scoped>
$bg-deepest: #0a0e1a;
$bg-dark: #0f1526;
$bg-card: #1a2744;
$cyber-primary: #00ffff;
$cyber-secondary: #ff00ff;
$text-light: #e8e8e8;
$text-dim: #6b7280;

.personality-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg-dark 0%, $bg-deepest 100%);
  color: $text-light;
  overflow-x: hidden;
  width: 100%;
  max-width: 100vw;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: rgba($bg-card, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba($cyber-primary, 0.1);
  
  .nav-back {
    display: flex;
    align-items: center;
    padding: 10rpx 20rpx;
    
    .back-icon {
      font-size: 36rpx;
      color: $cyber-primary;
      margin-right: 10rpx;
    }
    
    .back-text {
      font-size: 28rpx;
      color: $text-light;
    }
  }
  
  .nav-title {
    font-size: 34rpx;
    font-weight: bold;
    color: $cyber-primary;
  }
  
  .nav-placeholder {
    width: 120rpx;
  }
}

.content-scroll {
  height: calc(100vh - 100rpx);
  padding: 30rpx;
  width: 100%;
  box-sizing: border-box;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, rgba($bg-card, 0.9), rgba(#1e3a5f, 0.8));
  border-radius: 24rpx;
  border: 1px solid rgba($cyber-primary, 0.2);
  margin-bottom: 30rpx;
  
  .pet-avatar {
    width: 120rpx;
    height: 120rpx;
    background: rgba($cyber-primary, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 30rpx;
    
    .avatar-emoji {
      font-size: 60rpx;
    }
  }
  
  .summary-info {
    flex: 1;
    
    .pet-name {
      font-size: 36rpx;
      font-weight: bold;
      color: $text-light;
      display: block;
      margin-bottom: 10rpx;
    }
    
    .personality-desc {
      font-size: 26rpx;
      color: $cyber-primary;
    }
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $text-light;
  margin-bottom: 20rpx;
  display: block;
}

.radar-section {
  margin-bottom: 30rpx;
}

.radar-container {
  display: flex;
  justify-content: center;
  padding: 20rpx;
  background: rgba($bg-card, 0.5);
  border-radius: 20rpx;
  overflow: hidden;
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  
  .radar-canvas {
    width: 500rpx;
    height: 500rpx;
  }
}

.traits-section {
  margin-bottom: 30rpx;
}

.trait-card {
  padding: 24rpx;
  background: rgba($bg-card, 0.6);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  border: 1px solid rgba($cyber-primary, 0.1);
  
  .trait-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .trait-emoji {
      font-size: 32rpx;
      margin-right: 16rpx;
    }
    
    .trait-name {
      flex: 1;
      font-size: 28rpx;
      font-weight: bold;
      color: $text-light;
    }
    
    .trait-value {
      font-size: 28rpx;
      font-weight: bold;
      color: $cyber-primary;
      font-family: monospace;
    }
  }
  
  .trait-bar-bg {
    height: 12rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6rpx;
    overflow: hidden;
    margin-bottom: 12rpx;
    
    .trait-bar {
      height: 100%;
      border-radius: 6rpx;
      transition: width 0.5s ease;
    }
  }
  
  .trait-desc {
    font-size: 24rpx;
    color: $text-dim;
  }
}

.evolution-section {
  margin-bottom: 30rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  
  .stat-card {
    padding: 24rpx 16rpx;
    background: rgba($bg-card, 0.6);
    border-radius: 16rpx;
    text-align: center;
    border: 1px solid rgba($cyber-primary, 0.1);
    
    .stat-value {
      font-size: 36rpx;
      font-weight: bold;
      color: $cyber-primary;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .stat-label {
      font-size: 22rpx;
      color: $text-dim;
    }
  }
}

.action-section {
  display: flex;
  gap: 20rpx;
  margin-bottom: 60rpx;
  
  .action-btn {
    flex: 1;
    padding: 24rpx;
    border-radius: 16rpx;
    font-size: 28rpx;
    font-weight: bold;
    border: none;
    
    &.primary-btn {
      background: linear-gradient(135deg, $cyber-primary, #00a3cc);
      color: $bg-deepest;
    }
    
    &.danger-btn {
      background: rgba(255, 100, 100, 0.2);
      color: #ff6464;
      border: 1px solid rgba(255, 100, 100, 0.3);
    }
  }
}
</style>
