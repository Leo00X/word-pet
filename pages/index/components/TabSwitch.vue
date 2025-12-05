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
  background: #0f1526;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 11px;
  border-radius: 6px;
  color: #747d8c;
  transition: all 0.2s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #2f3542, #1a2744);
  color: #00d9ff;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 217, 255, 0.15);
}
</style>
