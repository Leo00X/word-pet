<template>
  <view class="status-bar">
    <view class="level-box">
      <text class="pixel-text">等级.{{ petLevel }}</text>
    </view>
    <view class="coin-box">
      <text class="coin-icon">🪙</text>
      <text class="pixel-text">{{ coins }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'StatusBar',
  props: {
    petLevel: {
      type: Number,
      default: 1
    },
    coins: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style lang="scss" scoped>
.status-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 0 5px;
}

.pixel-text {
  font-weight: bold;
  font-size: 16px;
  text-shadow: 2px 2px #000;
}

.coin-box { 
  display: flex; 
  align-items: center; 
  gap: 5px; 
}
</style>
