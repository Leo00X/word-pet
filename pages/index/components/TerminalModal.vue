<template>
  <view class="terminal-modal" v-if="showTerminal">
    <view class="terminal-window">
      <view class="terminal-header">
        <text class="terminal-title">管理员@单词寄生兽:~#</text>
        <text class="close-x" @click="$emit('close')">[ 关闭 ]</text>
      </view>
      <view class="terminal-toolbar">
        <text :style="{color: isMonitoring ? '#2ed573' : '#ff4757'}">
          状态: {{ isMonitoring ? '运行中' : '已停止' }}
        </text>
        <text class="btn-text" @click="$emit('clear-log')">[清空屏幕]</text>
      </view>
      <scroll-view scroll-y="true" class="log-scroll" :scroll-top="scrollTop">
        <text class="log-text">{{ logText }}</text>
      </scroll-view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'TerminalModal',
  props: {
    showTerminal: {
      type: Boolean,
      default: false
    },
    isMonitoring: {
      type: Boolean,
      default: false
    },
    logText: {
      type: String,
      default: ''
    },
    scrollTop: {
      type: Number,
      default: 9999
    }
  }
}
</script>

<style lang="scss" scoped>
$accent-green: #2ed573;

/* 终端弹窗 */
.terminal-modal {
  position: fixed; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0;
  background: rgba(0,0,0,0.8);
  z-index: 999;
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.terminal-window {
  width: 90%; 
  height: 70%;
  background: #000;
  border: 1px solid $accent-green;
  display: flex; 
  flex-direction: column;
  box-shadow: 0 0 20px rgba(46, 213, 115, 0.2);
  padding: 10px;
}

.terminal-header {
  display: flex; 
  justify-content: space-between;
  border-bottom: 1px dashed #333;
  padding-bottom: 5px; 
  margin-bottom: 5px;
  color: $accent-green; 
  font-size: 12px;
}

.terminal-toolbar {
  display: flex; 
  gap: 15px; 
  font-size: 12px; 
  margin-bottom: 10px;
}

.btn-text { 
  text-decoration: underline; 
  color: #fff; 
}

.log-scroll { 
  flex: 1; 
  height: 0; 
}

.log-text { 
  font-size: 10px; 
  line-height: 1.4; 
  color: $accent-green; 
}
</style>
