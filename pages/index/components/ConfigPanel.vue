<template>
  <view class="panel-body">
    <view class="setting-item" @click="$emit('open-selector', 'whitelist')">
      <view class="icon-box">🍖</view>
      <view class="setting-text">
        <text class="main-text">投喂规则 (白名单)</text>
        <text class="sub-text">设置作为"食物"的学习软件</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="navigateToAISelector">
      <view class="icon-box">🤖</view>
      <view class="setting-text">
        <text class="main-text">AI 模型选择</text>
        <text class="sub-text">切换或配置 AI 对话模型</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="$emit('open-selector', 'blacklist')">
      <view class="icon-box">☠️</view>
      <view class="setting-text">
        <text class="main-text">禁忌物品 (黑名单)</text>
        <text class="sub-text">设置会让宠物暴走的娱乐软件</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-block">
      <text class="block-title">扫描频率 ({{ (monitorIntervalTime / 1000).toFixed(0) }} 秒/次)</text>
      <slider 
        :value="monitorIntervalTime" 
        min="3000" 
        max="60000" 
        step="1000" 
        activeColor="#2ed573" 
        backgroundColor="#57606f"
        block-color="#ffa502"
        block-size="18"
        @change="handleIntervalChange"
      />
    </view>

    <button class="game-btn terminal-btn" @click="$emit('open-terminal')">
      <text>🖥️ 进入监控终端</text>
    </button>
  </view>
</template>

<script>
export default {
  name: 'ConfigPanel',
  props: {
    monitorIntervalTime: {
      type: Number,
      default: 3000
    }
  },
  methods: {
    handleIntervalChange(e) {
      this.$emit('interval-change', e.detail.value);
    },
    navigateToAISelector() {
      uni.navigateTo({
        url: '/pages/config/ai-selector'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
$text-dim: #747d8c;

/* 配置项 */
.setting-item {
  display: flex; 
  align-items: center;
  background: #2f3542;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.icon-box { 
  font-size: 20px; 
  margin-right: 12px; 
}

.setting-text { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.main-text { 
  font-size: 14px; 
  font-weight: bold; 
}

.sub-text { 
  font-size: 10px; 
  color: $text-dim; 
  margin-top: 2px; 
}

.arrow { 
  color: $text-dim; 
}

.setting-block { 
  background: #2f3542; 
  padding: 12px; 
  border-radius: 8px; 
  margin-top: 20px; 
}

.block-title { 
  display: block; 
  font-size: 12px; 
  color: $text-dim; 
  margin-bottom: 10px; 
}

.game-btn {
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}

.terminal-btn { 
  background: #2f3542; 
  border: 1px solid #57606f; 
  margin-top: 20px; 
  font-size: 12px; 
}
</style>
