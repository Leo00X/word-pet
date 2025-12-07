<template>
  <view class="personality-panel">
    <!-- 标题区域 -->
    <view class="panel-header">
      <text class="panel-title">🎭 宠物人格</text>
      <text class="panel-subtitle">{{ personalitySummary }}</text>
    </view>

    <!-- 雷达图区域 -->
    <view class="radar-container">
      <canvas 
        canvas-id="personalityRadar" 
        class="radar-canvas"
        @touchend="handleCanvasTap"
      ></canvas>
      
      <!-- 人格标签 -->
      <view class="trait-labels">
        <view class="trait-label trait-o" :style="{ opacity: traits.openness > 0.5 ? 1 : 0.5 }">
          <text class="trait-icon">🔮</text>
          <text class="trait-name">开放性</text>
        </view>
        <view class="trait-label trait-c" :style="{ opacity: traits.conscientiousness > 0.5 ? 1 : 0.5 }">
          <text class="trait-icon">📋</text>
          <text class="trait-name">尽责性</text>
        </view>
        <view class="trait-label trait-e" :style="{ opacity: traits.extraversion > 0.5 ? 1 : 0.5 }">
          <text class="trait-icon">🎉</text>
          <text class="trait-name">外向性</text>
        </view>
        <view class="trait-label trait-a" :style="{ opacity: traits.agreeableness > 0.5 ? 1 : 0.5 }">
          <text class="trait-icon">💕</text>
          <text class="trait-name">宜人性</text>
        </view>
        <view class="trait-label trait-n" :style="{ opacity: traits.neuroticism > 0.5 ? 1 : 0.5 }">
          <text class="trait-icon">😤</text>
          <text class="trait-name">神经质</text>
        </view>
      </view>
    </view>

    <!-- 数值详情 -->
    <view class="traits-detail">
      <view class="trait-row" v-for="(item, index) in traitsList" :key="index">
        <view class="trait-info">
          <text class="trait-emoji">{{ item.emoji }}</text>
          <text class="trait-title">{{ item.name }}</text>
        </view>
        <view class="trait-bar-container">
          <view class="trait-bar" :style="{ width: (item.value * 100) + '%', background: item.color }"></view>
        </view>
        <text class="trait-value">{{ (item.value * 100).toFixed(0) }}%</text>
      </view>
    </view>

    <!-- 演化统计 -->
    <view class="evolution-stats">
      <view class="stat-item">
        <text class="stat-value">{{ evolutionCount }}</text>
        <text class="stat-label">演化次数</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ dominantTraitName }}</text>
        <text class="stat-label">主导特质</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button class="action-btn reset-btn" @tap="handleReset">
        <text>🔄 重置人格</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';

// Props
const props = defineProps({
  personality: {
    type: Object,
    default: () => ({
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    })
  },
  personalitySummary: {
    type: String,
    default: '性格平衡'
  },
  evolutionCount: {
    type: Number,
    default: 0
  },
  dominantTrait: {
    type: Object,
    default: () => ({ name: '未知', key: 'openness' })
  }
});

// Emits
const emit = defineEmits(['reset']);

// 计算属性
const traits = computed(() => props.personality);

const dominantTraitName = computed(() => props.dominantTrait?.name || '未知');

const traitsList = computed(() => [
  { name: '开放性', key: 'openness', emoji: '🔮', value: traits.value.openness, color: 'linear-gradient(90deg, #9b59b6, #8e44ad)' },
  { name: '尽责性', key: 'conscientiousness', emoji: '📋', value: traits.value.conscientiousness, color: 'linear-gradient(90deg, #3498db, #2980b9)' },
  { name: '外向性', key: 'extraversion', emoji: '🎉', value: traits.value.extraversion, color: 'linear-gradient(90deg, #f1c40f, #f39c12)' },
  { name: '宜人性', key: 'agreeableness', emoji: '💕', value: traits.value.agreeableness, color: 'linear-gradient(90deg, #2ecc71, #27ae60)' },
  { name: '神经质', key: 'neuroticism', emoji: '😤', value: traits.value.neuroticism, color: 'linear-gradient(90deg, #e74c3c, #c0392b)' }
]);

// 方法
const handleReset = () => {
  uni.showModal({
    title: '重置人格',
    content: '确定要将宠物人格重置为初始状态吗？',
    success: (res) => {
      if (res.confirm) {
        emit('reset');
      }
    }
  });
};

const handleCanvasTap = () => {
  // 点击雷达图时的交互（可扩展）
};

// 绘制雷达图
const drawRadar = () => {
  const ctx = uni.createCanvasContext('personalityRadar');
  const centerX = 120;
  const centerY = 120;
  const radius = 80;
  const traits = [
    props.personality.openness,
    props.personality.conscientiousness,
    props.personality.extraversion,
    props.personality.agreeableness,
    props.personality.neuroticism
  ];
  const angleStep = (Math.PI * 2) / 5;
  const startAngle = -Math.PI / 2;  // 从顶部开始

  // 清空画布
  ctx.clearRect(0, 0, 240, 240);

  // 绘制背景网格
  ctx.setStrokeStyle('rgba(0, 255, 255, 0.1)');
  ctx.setLineWidth(1);
  
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    const levelRadius = (radius / 5) * level;
    for (let i = 0; i <= 5; i++) {
      const angle = startAngle + angleStep * i;
      const x = centerX + Math.cos(angle) * levelRadius;
      const y = centerY + Math.sin(angle) * levelRadius;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  ctx.setStrokeStyle('rgba(0, 255, 255, 0.2)');
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
    const value = traits[i];
    const x = centerX + Math.cos(angle) * (radius * value);
    const y = centerY + Math.sin(angle) * (radius * value);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  
  // 填充
  ctx.setFillStyle('rgba(0, 255, 255, 0.3)');
  ctx.fill();
  
  // 描边
  ctx.setStrokeStyle('#00ffff');
  ctx.setLineWidth(2);
  ctx.stroke();

  // 绘制数据点
  ctx.setFillStyle('#00ffff');
  for (let i = 0; i < 5; i++) {
    const angle = startAngle + angleStep * i;
    const value = traits[i];
    const x = centerX + Math.cos(angle) * (radius * value);
    const y = centerY + Math.sin(angle) * (radius * value);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.draw();
};

// 生命周期
onMounted(() => {
  setTimeout(drawRadar, 100);
});

// 监听数据变化重绘
watch(() => props.personality, () => {
  drawRadar();
}, { deep: true });
</script>

<style lang="scss" scoped>
.personality-panel {
  padding: 20rpx;
}

.panel-header {
  text-align: center;
  margin-bottom: 30rpx;
  
  .panel-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #00ffff;
    display: block;
  }
  
  .panel-subtitle {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 10rpx;
    display: block;
  }
}

.radar-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  margin-bottom: 30rpx;
  
  .radar-canvas {
    width: 240px;
    height: 240px;
  }
  
  .trait-labels {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    
    .trait-label {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: opacity 0.3s;
      
      .trait-icon {
        font-size: 24rpx;
      }
      
      .trait-name {
        font-size: 20rpx;
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    .trait-o { top: -10rpx; left: 50%; transform: translateX(-50%); }
    .trait-c { top: 80rpx; right: 20rpx; }
    .trait-e { bottom: 40rpx; right: 40rpx; }
    .trait-a { bottom: 40rpx; left: 40rpx; }
    .trait-n { top: 80rpx; left: 20rpx; }
  }
}

.traits-detail {
  margin-bottom: 30rpx;
  
  .trait-row {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .trait-info {
      width: 140rpx;
      display: flex;
      align-items: center;
      
      .trait-emoji {
        font-size: 28rpx;
        margin-right: 8rpx;
      }
      
      .trait-title {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.9);
      }
    }
    
    .trait-bar-container {
      flex: 1;
      height: 16rpx;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8rpx;
      overflow: hidden;
      margin: 0 16rpx;
      
      .trait-bar {
        height: 100%;
        border-radius: 8rpx;
        transition: width 0.5s ease;
      }
    }
    
    .trait-value {
      width: 80rpx;
      text-align: right;
      font-size: 24rpx;
      color: #00ffff;
      font-family: monospace;
    }
  }
}

.evolution-stats {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background: rgba(0, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      font-size: 32rpx;
      font-weight: bold;
      color: #00ffff;
      display: block;
    }
    
    .stat-label {
      font-size: 22rpx;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 6rpx;
      display: block;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  
  .action-btn {
    padding: 16rpx 40rpx;
    border-radius: 30rpx;
    font-size: 26rpx;
    border: none;
    
    &.reset-btn {
      background: rgba(255, 100, 100, 0.2);
      color: #ff6464;
      border: 1px solid rgba(255, 100, 100, 0.3);
    }
  }
}
</style>
