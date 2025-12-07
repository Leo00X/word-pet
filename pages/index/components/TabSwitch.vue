<template>
  <view class="tab-switch">
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'status' }"
      @click="handleTabChange('status')"
    >
      📊 状态
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'config' }"
      @click="handleTabChange('config')"
    >
      ⚙️ 设置
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'chat' }"
      @click="handleTabChange('chat')"
    >
      💬 对话
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'backpack' }"
      @click="handleTabChange('backpack')"
    >
      🎒 背包
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'diary' }"
      @click="handleTabChange('diary')"
    >
      📔 日记
    </view>
  </view>
</template>

<script>
export default {
  name: 'TabSwitch',
  props: {
    currentTab: {
      type: String,
      default: 'status'
    }
  },
  methods: {
    handleTabChange(tab) {
      this.$emit('update:currentTab', tab);
    }
  }
}
</script>

<style lang="scss" scoped>
.tab-switch {
  display: flex;
  background: linear-gradient(180deg, $bg-dark, darken($bg-dark, 3%));
  border-radius: $radius-md;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
  border: 1px solid rgba($cyber-primary, 0.1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tab-btn {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 11px;
  border-radius: $radius-sm;
  color: $text-dim;
  transition: all $transition-normal $ease-smooth;
  position: relative;
  z-index: 1;
  
  &:active {
    transform: scale(0.95);
  }
}

.tab-btn.active {
  background: linear-gradient(135deg, rgba($bg-elevated, 0.9), rgba($bg-card, 0.9));
  color: $cyber-primary;
  font-weight: bold;
  box-shadow: 
    0 2px 8px rgba($cyber-primary, 0.2),
    0 0 0 1px rgba($cyber-primary, 0.15);
  
  // 底部霓虹指示线
  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: $gradient-cyber;
    border-radius: 2px;
    box-shadow: 0 0 8px rgba($cyber-primary, 0.5);
  }
}
</style>
