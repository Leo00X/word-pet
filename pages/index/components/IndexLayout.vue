<template>
  <view class="game-container">
    <!-- 顶部状态栏 -->
    <slot name="status-bar" />

    <!-- 宠物显示区域 -->
    <slot name="pet-screen" />

    <!-- 控制器区域 -->
    <view class="controller-area">
      <!-- Tab 切换 -->
      <slot name="tabs" />

      <!-- 内容面板 -->
      <view class="tab-content">
        <slot name="content" />
      </view>
    </view>

    <!-- 终端弹窗 -->
    <slot name="terminal" />

    <!-- 弹窗容器 -->
    <slot name="modals" />
  </view>
</template>

<script>
export default {
  name: 'IndexLayout'
};
</script>

<style lang="scss" scoped>
$bg-color: #1a1a2e;
$card-bg: #16213e;

.game-container {
  background-color: $bg-color;
  min-height: 100vh;
  padding: 20px;
  font-family: monospace;
  display: flex;
  flex-direction: column;
}

.controller-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $card-bg;
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 5px 0 #0f1526;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}
</style>
