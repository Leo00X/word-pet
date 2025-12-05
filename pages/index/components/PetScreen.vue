<template>
  <view class="main-screen">
    <view class="screen-content" :class="{ 'glitch-effect': isMonitoring }">
      <!-- 宠物区域 (居中) -->
      <view class="pet-area">
        <text 
          class="pet-avatar-emoji" 
          :class="{ 'floating': isPetShown }"
          @tap="handleInteract"
        >
          {{ petEmoji }}
        </text>
        
        <view class="interact-hint" v-if="!isPetShown">
          <text>👆 点击抚摸</text>
        </view>
        
        <view class="pixel-bubble" v-if="isPetShown && petMessage">
          <text>{{ petMessage }}</text>
        </view>
      </view>

      <!-- 属性条区域 (底部) -->
      <view class="stats-bottom">
        <view class="stat-row">
          <text class="stat-label">❤️</text>
          <view class="stat-bar-wrap">
            <progress 
              class="stat-bar" 
              :percent="mood" 
              :activeColor="moodColor" 
              backgroundColor="#2f3542" 
              stroke-width="8" 
            />
          </view>
          <text class="stat-value" :style="{color: moodColor}">{{ mood }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">⭐</text>
          <view class="stat-bar-wrap">
            <progress 
              class="stat-bar" 
              :percent="expPercent" 
              activeColor="#2ed573" 
              backgroundColor="#2f3542" 
              stroke-width="8" 
            />
          </view>
          <text class="stat-value" style="color:#2ed573">{{ expPercent }}%</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">🍖</text>
          <view class="stat-bar-wrap">
            <progress 
              class="stat-bar" 
              :percent="hunger" 
              activeColor="#ffaa00" 
              backgroundColor="#2f3542" 
              stroke-width="8" 
            />
          </view>
          <text class="stat-value" style="color:#ffaa00">{{ hunger }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">💕</text>
          <view class="stat-bar-wrap">
            <progress 
              class="stat-bar" 
              :percent="bond" 
              activeColor="#ff66cc" 
              backgroundColor="#2f3542" 
              stroke-width="8" 
            />
          </view>
          <text class="stat-value" style="color:#ff66cc">{{ bond }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PetScreen',
  props: {
    isMonitoring: {
      type: Boolean,
      default: false
    },
    isPetShown: {
      type: Boolean,
      default: false
    },
    petMessage: {
      type: String,
      default: ''
    },
    mood: {
      type: Number,
      default: 80
    },
    exp: {
      type: Number,
      default: 0
    },
    hunger: {
      type: Number,
      default: 100
    },
    bond: {
      type: Number,
      default: 0
    },
    petEmoji: {
      type: String,
      default: '👻'
    }
  },
  
  computed: {
    expPercent() {
      return Math.min(100, this.exp);
    },
    
    moodColor() {
      if (this.mood > 80) return '#00ff88';
      if (this.mood > 50) return '#ffaa00';
      if (this.mood > 20) return '#ff4757';
      return '#ff3366';
    }
  },
  
  methods: {
    handleInteract() {
      this.$emit('interact');
      uni.vibrateShort(); // 短震动反馈
    }
  }
}
</script>

<style lang="scss" scoped>
/* 游戏屏幕 */
.main-screen {
  background: #000;
  border: 4px solid #2f3542;
  border-radius: 12px;
  height: 280px;
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 
    0 0 20px rgba(0,0,0,0.5),
    inset 0 0 30px rgba(0,217,255,0.05);
}

.screen-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 30%, #1a2744 0%, #0a0f1a 70%, #000 100%);
  position: relative;
}

/* 宠物区域 - 居中 */
.pet-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
}

.pet-avatar-emoji {
  font-size: 100px;
  line-height: 1;
  z-index: 10;
  transition: all 0.5s ease;
  display: block;
  text-align: center;
  filter: drop-shadow(0 0 20px rgba(0,217,255,0.3));
  cursor: pointer;
}

.interact-hint {
  font-size: 12px;
  color: #747d8c;
  margin-top: 10px;
  opacity: 0.7;
}

.floating { 
  animation: float 3s ease-in-out infinite; 
}

@keyframes float { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-12px); } 
}

.pixel-bubble {
  background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,240,240,0.9));
  color: #1a1a2e;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 12px;
  position: relative;
  max-width: 85%;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  border: 1px solid rgba(0,217,255,0.2);
}

.pixel-bubble::after {
  content: ''; 
  position: absolute; 
  top: -8px; 
  left: 50%; 
  transform: translateX(-50%);
  border-width: 0 8px 8px; 
  border-style: solid; 
  border-color: transparent transparent rgba(255,255,255,0.95);
}

/* 属性条 - 底部 */
.stats-bottom {
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.9) 100%);
  padding: 10px 15px 12px;
}

.stat-row {
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin-bottom: 6px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-label { 
  font-size: 14px; 
  width: 22px;
  text-align: center;
}

.stat-bar-wrap {
  flex: 1;
  background: rgba(47, 53, 66, 0.5);
  border-radius: 6px;
  overflow: hidden;
  height: 10px;
}

.stat-bar { 
  width: 100%;
  border-radius: 6px; 
}

.stat-value {
  font-size: 11px;
  font-weight: bold;
  width: 32px;
  text-align: right;
  font-family: monospace;
}

/* 监控中的毛玻璃效果 */
.glitch-effect {
  animation: scan-lines 0.1s linear infinite;
}

@keyframes scan-lines {
  0% { background-position: 0 0; }
  100% { background-position: 0 4px; }
}

.glitch-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 217, 255, 0.03) 2px,
    rgba(0, 217, 255, 0.03) 4px
  );
  pointer-events: none;
  z-index: 100;
}
</style>
