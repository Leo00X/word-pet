<template>
  <view class="history-container">
    <view class="nav-header">
      <text class="back-btn" @click="goBack">&lt; 返回</text>
      <text class="page-title">数据档案库</text>
      <text class="clear-btn" @click="clearLogs">清空</text>
    </view>

    <view class="summary-card">
      <text class="summary-text">当前心情: {{ currentMood }} | 累计记录: {{ logs.length }} 条</text>
    </view>

    <scroll-view scroll-y="true" class="list-scroll">
      <view v-if="logs.length === 0" class="empty-state">
        <text>暂无数据记录...</text>
      </view>

      <view v-for="(item, index) in logs" :key="index" class="log-row">
        <view class="log-time-box">
           <text class="log-date">{{ formatDate(item.timestamp) }}</text>
           <text class="log-time">{{ item.time }}</text>
        </view>
        <view class="log-detail">
          <text class="log-msg">{{ item.msg }}</text>
          <text class="log-val" :class="item.val > 0 ? 't-green' : 't-red'">
            {{ item.val > 0 ? '+' : '' }}{{ item.val }}
          </text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      logs: [],
      currentMood: 0
    };
  },
  onShow() {
    // 读取本地存储
    this.logs = uni.getStorageSync('pet_growth_logs') || [];
    // 顺便读取一下心情值显示
    this.currentMood = uni.getStorageSync('pet_mood_cache') || 80;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    clearLogs() {
      uni.showModal({
        title: '警告',
        content: '确定要销毁所有历史档案吗？此操作不可逆。',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('pet_growth_logs');
            this.logs = [];
            uni.showToast({ title: '档案已销毁', icon: 'none' });
          }
        }
      });
    },
    // 简单格式化日期，如果是今天则不显示日期
    formatDate(ts) {
        if (!ts) return '';
        const date = new Date(ts);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return '今日';
        }
        return `${date.getMonth()+1}/${date.getDate()}`;
    }
  }
}
</script>

<style lang="scss">
$bg-color: #1a1a2e;
$card-bg: #16213e;
$accent-green: #2ed573;
$accent-red: #ff4757;
$text-dim: #747d8c;

.history-container {
  background-color: $bg-color;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  color: #f1f2f6;
  font-family: monospace;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 20px; /* 避让状态栏 */
}
.page-title { font-size: 16px; font-weight: bold; color: $accent-green; text-shadow: 0 0 5px rgba(46, 213, 115, 0.3); }
.back-btn { color: #fff; font-size: 14px; }
.clear-btn { color: $accent-red; font-size: 12px; border: 1px solid $accent-red; padding: 2px 8px; border-radius: 4px; }

.summary-card {
    background: $card-bg;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 15px;
    text-align: center;
    border: 1px solid #2f3542;
}
.summary-text { font-size: 12px; color: $text-dim; }

.list-scroll { flex: 1; height: 0; background: #0f1526; border-radius: 8px; border: 1px solid #2f3542; padding: 10px; box-sizing: border-box; }

.log-row {
    display: flex;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px dashed #2f3542;
}
.log-time-box {
    display: flex;
    flex-direction: column;
    width: 50px;
    margin-right: 10px;
    text-align: center;
    border-right: 2px solid #2f3542;
    padding-right: 5px;
}
.log-date { font-size: 10px; color: $text-dim; }
.log-time { font-size: 12px; font-weight: bold; color: #a4b0be; }

.log-detail { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.log-msg { font-size: 13px; color: #dfe4ea; }
.log-val { font-weight: bold; font-size: 14px; margin-left: 10px; }

.t-green { color: $accent-green; }
.t-red { color: $accent-red; }

.empty-state { text-align: center; margin-top: 50px; color: $text-dim; font-size: 12px; }
</style>