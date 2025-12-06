<template>
  <view class="diary-history-container">
    <view class="nav-header">
      <text class="back-btn" @click="goBack">&lt; 返回</text>
      <text class="page-title">📔 日记档案</text>
      <text class="clear-btn" @click="clearDiaries">清空</text>
    </view>

    <view class="summary-card">
      <text class="summary-text">共 {{ diaries.length }} 篇日记 | 总字数约 {{ totalWords }}</text>
    </view>

    <scroll-view scroll-y="true" class="list-scroll">
      <view v-if="diaries.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">还没有写过日记</text>
        <text class="empty-hint">去主页日记 Tab 开始记录吧~</text>
      </view>

      <view v-for="(diary, index) in diaries" :key="diary.id" class="diary-card" @tap="viewDiary(diary)">
        <view class="diary-header">
          <text class="diary-date">{{ formatDate(diary.timestamp) }}</text>
          <text class="diary-time">{{ diary.time }}</text>
        </view>
        <view class="diary-preview">
          <text class="preview-text">{{ getPreview(diary.content) }}</text>
        </view>
        <view class="diary-meta" v-if="diary.data">
          <text class="meta-tag">📚 {{ diary.data.studyMinutes }}min</text>
          <text class="meta-tag">🐟 {{ diary.data.slackMinutes }}min</text>
          <text class="meta-tag">Lv.{{ diary.data.level }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      diaries: []
    };
  },
  
  computed: {
    totalWords() {
      return this.diaries.reduce((sum, d) => sum + (d.content?.length || 0), 0);
    }
  },
  
  onShow() {
    this.loadDiaries();
  },
  
  methods: {
    loadDiaries() {
      this.diaries = uni.getStorageSync('pet_diaries') || [];
    },
    
    goBack() {
      uni.navigateBack();
    },
    
    clearDiaries() {
      uni.showModal({
        title: '确认',
        content: '确定要删除所有日记吗？此操作不可恢复。',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('pet_diaries');
            this.diaries = [];
            uni.showToast({ title: '日记已清空', icon: 'none' });
          }
        }
      });
    },
    
    formatDate(ts) {
      if (!ts) return '';
      const date = new Date(ts);
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return '今天';
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
      }
      
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    },
    
    getPreview(content) {
      if (!content) return '(空日记)';
      // 移除换行和HTML标签，只取前80个字符
      const text = content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ');
      return text.length > 80 ? text.substring(0, 80) + '...' : text;
    },
    
    viewDiary(diary) {
      uni.showModal({
        title: this.formatDate(diary.timestamp) + ' ' + diary.time,
        content: diary.content.replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''),
        showCancel: false,
        confirmText: '关闭'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
$bg-color: #1a1a2e;
$card-bg: #16213e;
$accent-purple: #7b68ee;
$accent-cyan: #00d9ff;
$text-light: #e8e8e8;
$text-dim: #747d8c;

.diary-history-container {
  background-color: $bg-color;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  color: $text-light;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-top: 20px;
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: $accent-purple;
  text-shadow: 0 0 8px rgba(123, 104, 238, 0.4);
}

.back-btn {
  color: $text-light;
  font-size: 14px;
}

.clear-btn {
  color: #ff4757;
  font-size: 12px;
  border: 1px solid #ff4757;
  padding: 4px 10px;
  border-radius: 6px;
}

.summary-card {
  background: linear-gradient(135deg, rgba($accent-purple, 0.1), rgba($accent-cyan, 0.1));
  border: 1px solid rgba($accent-purple, 0.2);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  text-align: center;
}

.summary-text {
  font-size: 12px;
  color: $text-dim;
}

.list-scroll {
  flex: 1;
  height: 0;
  background: rgba($card-bg, 0.3);
  border-radius: 12px;
  border: 1px solid rgba($accent-cyan, 0.1);
  padding: 12px;
  box-sizing: border-box;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: $text-light;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: $text-dim;
}

.diary-card {
  background: linear-gradient(145deg, rgba($card-bg, 0.8), rgba(#1e3a5f, 0.6));
  border: 1px solid rgba($accent-purple, 0.2);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
    border-color: rgba($accent-purple, 0.5);
  }
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.diary-date {
  font-size: 14px;
  font-weight: bold;
  color: $accent-cyan;
}

.diary-time {
  font-size: 11px;
  color: $text-dim;
}

.diary-preview {
  margin-bottom: 10px;
}

.preview-text {
  font-size: 13px;
  line-height: 1.6;
  color: $text-light;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diary-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  font-size: 10px;
  color: $text-dim;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid rgba($accent-cyan, 0.1);
}
</style>
