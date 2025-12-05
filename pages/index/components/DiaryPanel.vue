<template>
  <view class="diary-panel">
    <view class="diary-header">
      <text class="header-title">📔 WordParasite 的日记</text>
      <text class="header-date">📅 {{ todayDate }}</text>
    </view>
    
    <!-- 今日日记 -->
    <view class="diary-content">
      <scroll-view 
        class="diary-scroll" 
        scroll-y
        v-if="currentDiary"
      >
        <view class="diary-text">
          <rich-text :nodes="formattedDiary"></rich-text>
        </view>
        <view class="diary-meta">
          <text class="meta-time">写于 {{ currentDiary.time }}</text>
        </view>
      </scroll-view>
      
      <view class="diary-empty" v-else>
        <text class="empty-icon">📝</text>
        <text class="empty-text">今天还没有写日记</text>
        <text class="empty-hint">点击下方按钮让我记录今天的故事</text>
      </view>
    </view>
    
    <!-- 操作按钮 -->
    <view class="diary-actions">
      <button 
        class="action-btn write-btn"
        :disabled="isWriting"
        @tap="writeDiary"
      >
        <text v-if="isWriting">✍️ 正在写日记...</text>
        <text v-else>✏️ 写今日日记</text>
      </button>
      <button 
        class="action-btn history-btn"
        @tap="openHistory"
      >
        📖 历史日记
      </button>
    </view>
    
    <!-- 今日数据预览 -->
    <view class="data-preview">
      <text class="preview-title">📊 今日数据</text>
      <view class="preview-grid">
        <view class="preview-item">
          <text class="preview-label">📚 学习</text>
          <text class="preview-value">{{ studyMinutes }}分钟</text>
        </view>
        <view class="preview-item">
          <text class="preview-label">🐟 摸鱼</text>
          <text class="preview-value">{{ slackMinutes }}分钟</text>
        </view>
        <view class="preview-item">
          <text class="preview-label">💬 对话</text>
          <text class="preview-value">{{ chatCount }}次</text>
        </view>
        <view class="preview-item">
          <text class="preview-label">❤️ 心情</text>
          <text class="preview-value">{{ moodStart }} → {{ moodEnd }}</text>
        </view>
      </view>
    </view>
    
    <!-- 应用使用排行榜 -->
    <view class="ranking-section" v-if="appRanking && appRanking.length > 0">
      <text class="ranking-title">🏆 应用排行榜 TOP5</text>
      <view class="ranking-list">
        <view class="ranking-item" v-for="(app, index) in appRanking" :key="app.package">
          <text class="ranking-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</text>
          <view class="ranking-info">
            <text class="ranking-name">{{ app.name }}</text>
            <text class="ranking-type" :class="app.type">{{ app.type === 'good' ? '📚' : app.type === 'bad' ? '🐟' : '📱' }}</text>
          </view>
          <view class="ranking-stats">
            <text class="ranking-time">{{ app.totalMinutes }}分钟</text>
            <text class="ranking-count">{{ app.count }}次</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'DiaryPanel',
  props: {
    studyMinutes: { type: Number, default: 0 },
    slackMinutes: { type: Number, default: 0 },
    chatCount: { type: Number, default: 0 },
    moodStart: { type: Number, default: 50 },
    moodEnd: { type: Number, default: 50 },
    level: { type: Number, default: 1 },
    events: { type: Array, default: () => [] },
    appRanking: { type: Array, default: () => [] }  // 应用排行榜
  },
  
  data() {
    return {
      isWriting: false,
      currentDiary: null
    };
  },
  
  computed: {
    todayDate() {
      const now = new Date();
      return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    },
    
    formattedDiary() {
      if (!this.currentDiary) return '';
      let text = this.currentDiary.content;
      // 处理换行
      text = text.replace(/\n/g, '<br>');
      // 处理表情强调
      text = text.replace(/([\u{1F300}-\u{1F9FF}])/gu, '<span style="font-size:18px;">$1</span>');
      return text;
    }
  },
  
  mounted() {
    this.loadTodayDiary();
  },
  
  methods: {
    loadTodayDiary() {
      const today = new Date().toDateString();
      const diaries = uni.getStorageSync('pet_diaries') || [];
      this.currentDiary = diaries.find(d => new Date(d.timestamp).toDateString() === today);
    },
    
    async writeDiary() {
      if (this.isWriting) return;
      
      this.isWriting = true;
      
      try {
        // 构建日记 prompt
        const prompt = this.buildDiaryPrompt();
        
        // 调用 AI 生成日记
        this.$emit('write-diary', {
          prompt,
          callback: (content) => {
            this.saveDiary(content);
            this.isWriting = false;
          },
          onError: () => {
            uni.showToast({ title: '日记生成失败', icon: 'none' });
            this.isWriting = false;
          }
        });
      } catch (e) {
        console.error('写日记失败:', e);
        this.isWriting = false;
      }
    },
    
    buildDiaryPrompt() {
      // 计算学习/摸鱼比
      const ratio = this.slackMinutes > 0 
        ? (this.studyMinutes / this.slackMinutes).toFixed(1) 
        : (this.studyMinutes > 0 ? '∞' : '-');
      
      // 心情变化描述
      const moodDelta = this.moodEnd - this.moodStart;
      const moodDesc = moodDelta > 10 ? '大涨' : moodDelta > 0 ? '微涨' : moodDelta < -10 ? '大跌' : moodDelta < 0 ? '微跌' : '稳定';
      
      return `你是一只名叫WordParasite的傲娇电子宠物，请根据以下今日数据，用第一人称写一篇可爱的日记（100-150字）：

📊 今日数据：
- 学习时长：${this.studyMinutes}分钟
- 摸鱼时长：${this.slackMinutes}分钟
- 学习/摸鱼比：${ratio}
- 对话次数：${this.chatCount}次
- 心情变化：${this.moodStart} → ${this.moodEnd}（${moodDesc}）
- 当前等级：Lv.${this.level}
- 今日事件：${this.events.length > 0 ? this.events.slice(0, 5).join('、') : '平静的一天'}

🎭 写作风格要求：
1. 用傲娇可爱的语气，偶尔用"才不是"、"哼"等表达
2. 根据数据评价宿主：学习多就勉强表扬，摸鱼多就毒舌吐槽
3. 表达对宿主的隐藏关心
4. 用1-2个emoji增加趣味
5. 期待明天的互动`;
    },
    
    saveDiary(content) {
      const diary = {
        id: Date.now(),
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        content,
        data: {
          studyMinutes: this.studyMinutes,
          slackMinutes: this.slackMinutes,
          chatCount: this.chatCount,
          moodChange: [this.moodStart, this.moodEnd],
          level: this.level
        }
      };
      
      const diaries = uni.getStorageSync('pet_diaries') || [];
      // 移除今天的旧日记（如果有）
      const today = new Date().toDateString();
      const filtered = diaries.filter(d => new Date(d.timestamp).toDateString() !== today);
      filtered.unshift(diary);
      
      // 只保留最近30天的日记
      const recent = filtered.slice(0, 30);
      uni.setStorageSync('pet_diaries', recent);
      
      this.currentDiary = diary;
      uni.showToast({ title: '日记写好啦！', icon: 'success' });
    },
    
    openHistory() {
      uni.navigateTo({ url: '/pages/diary/diary-history' });
    }
  }
}
</script>

<style lang="scss" scoped>
$bg-dark: #0f1526;
$bg-card: #1a2744;
$accent-cyan: #00d9ff;
$accent-purple: #7b68ee;
$accent-gold: #ffd700;
$text-light: #e8e8e8;
$text-dim: #6b7280;

.diary-panel {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: $text-light;
}

.header-date {
  font-size: 12px;
  color: $accent-cyan;
  background: rgba($accent-cyan, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.diary-content {
  flex: 1;
  background: linear-gradient(145deg, rgba($bg-card, 0.9), rgba(#1e3a5f, 0.8));
  border: 1px solid rgba($accent-purple, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  min-height: 150px;
}

.diary-scroll {
  height: 100%;
}

.diary-text {
  font-size: 14px;
  line-height: 1.8;
  color: $text-light;
}

.diary-meta {
  margin-top: 16px;
  text-align: right;
}

.meta-time {
  font-size: 11px;
  color: $text-dim;
  font-style: italic;
}

.diary-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: $text-light;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 12px;
  color: $text-dim;
}

.diary-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  
  &.write-btn {
    background: linear-gradient(135deg, $accent-purple, #9b59b6);
    color: #fff;
    
    &:disabled {
      opacity: 0.6;
    }
  }
  
  &.history-btn {
    background: rgba($bg-card, 0.8);
    color: $text-light;
    border: 1px solid rgba($accent-cyan, 0.2);
  }
}

.data-preview {
  background: rgba($bg-card, 0.6);
  border-radius: 12px;
  padding: 12px;
}

.preview-title {
  font-size: 12px;
  color: $text-dim;
  margin-bottom: 10px;
  display: block;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.preview-item {
  text-align: center;
}

.preview-label {
  display: block;
  font-size: 10px;
  color: $text-dim;
  margin-bottom: 4px;
}

.preview-value {
  display: block;
  font-size: 12px;
  font-weight: bold;
  color: $accent-cyan;
}

/* 排行榜样式 */
.ranking-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 15px;
  margin-top: 15px;
}

.ranking-title {
  display: block;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #ffa502;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 8px 10px;
}

.ranking-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2f3542;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 10px;
}

.rank-1 { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; }
.rank-2 { background: linear-gradient(135deg, #c0c0c0, #a8a8a8); color: #000; }
.rank-3 { background: linear-gradient(135deg, #cd7f32, #b87333); color: #fff; }

.ranking-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ranking-name {
  font-size: 12px;
  font-weight: bold;
  color: #dfe4ea;
}

.ranking-type {
  font-size: 10px;
}

.ranking-stats {
  text-align: right;
}

.ranking-time {
  display: block;
  font-size: 12px;
  font-weight: bold;
  color: $accent-cyan;
}

.ranking-count {
  display: block;
  font-size: 10px;
  color: $text-dim;
}
</style>
