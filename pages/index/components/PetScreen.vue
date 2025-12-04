<template>
  <view class="main-screen">
    <view class="screen-content" :class="{ 'glitch-effect': isMonitoring }">
      <image 
        class="pet-avatar" 
        :class="{ 'floating': isPetShown }"
        src="/static/logo.png" 
        mode="aspectFit"
      ></image>
      
      <view class="pixel-bubble" v-if="isPetShown">
        <text>{{ petMessage }}</text>
      </view>

      <view class="stats-overlay">
        <view class="stat-row">
          <text class="stat-label">心情</text>
          <progress class="stat-bar" :percent="mood" activeColor="#ff4757" backgroundColor="#2f3542" stroke-width="6" />
        </view>
        <view class="stat-row">
          <text class="stat-label">经验</text>
          <progress class="stat-bar" :percent="exp" activeColor="#2ed573" backgroundColor="#2f3542" stroke-width="6" />
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
      default: '等待指令...'
    },
    mood: {
      type: Number,
      default: 80
    },
    exp: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style lang="scss" scoped>
/* 游戏屏幕 */
.main-screen {
  background: #000;
  border: 4px solid #2f3542;
  border-radius: 10px;
  height: 260px;
  position: relative;
  overflow: hidden;
  margin-bottom: 25px;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
}

.screen-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, #2f3640 0%, #000 90%);
}

.pet-avatar {
  width: 100px;
  height: 100px;
  z-index: 10;
  transition: all 0.5s ease;
}

.floating { 
  animation: float 3s ease-in-out infinite; 
}

@keyframes float { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-10px); } 
}

.pixel-bubble {
  background: #fff;
  color: #000;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  margin-top: 10px;
  position: relative;
  max-width: 80%;
  text-align: center;
}

.pixel-bubble::after {
  content: ''; 
  position: absolute; 
  top: -5px; 
  left: 50%; 
  transform: translateX(-50%);
  border-width: 0 5px 5px; 
  border-style: solid; 
  border-color: transparent transparent #fff;
}

.stats-overlay {
  position: absolute;
  top: 10px; 
  left: 10px; 
  right: 10px;
}

.stat-row {
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin-bottom: 5px;
}

.stat-label { 
  font-size: 10px; 
  font-weight: bold; 
  width: 30px; 
}

.stat-bar { 
  flex: 1; 
  border-radius: 4px; 
  overflow: hidden; 
}
</style>
