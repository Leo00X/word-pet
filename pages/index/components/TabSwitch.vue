<template>
  <view class="tab-switch">
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'status' }"
      @click="handleTabChange('status')"
    >
      状态监控
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'config' }"
      @click="handleTabChange('config')"
    >
      系统设置
    </view>
    <view 
      class="tab-btn" 
      :class="{ active: currentTab === 'chat' }"
      @click="handleTabChange('chat')"
    >
      💬 对话
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
  font-size: 12px;
  border-radius: 6px;
  color: #747d8c;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #2f3542;
  color: #f1f2f6;
  font-weight: bold;
}
</style>
