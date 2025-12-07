<template>
  <view class="history-container">
    <!-- 统计信息 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-value">{{ history.length }}</text>
        <text class="stat-label">条记录</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ mostUsedTopic }}</text>
        <text class="stat-label">最多话题</text>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <scroll-view class="history-list" scroll-y>
      <view v-if="history.length === 0" class="empty-state">
        <text class="empty-icon">🎲</text>
        <text class="empty-text">暂无随机互动记录</text>
        <text class="empty-hint">宠物会主动找你聊天哦~</text>
      </view>

      <view 
        v-for="item in reversedHistory" 
        :key="item.id" 
        class="history-item"
        :class="getEmotionClass(item.emotion)"
      >
        <view class="item-header">
          <text class="item-emotion">{{ getEmotionEmoji(item.emotion) }}</text>
          <text class="item-topic">{{ getTopicLabel(item.topic) }}</text>
          <text class="item-time">{{ formatTime(item.timestamp) }}</text>
        </view>
        <text class="item-text">{{ item.text }}</text>
        <view class="item-footer">
          <text class="item-reason">{{ getReasonLabel(item.reason) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作 -->
    <view class="actions">
      <button class="action-btn clear-btn" @click="handleClear">
        <text>🗑️ 清空历史</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['clear']);

// 倒序显示（最新在前）
const reversedHistory = computed(() => {
  return [...props.history].reverse();
});

// 统计最多使用的话题
const mostUsedTopic = computed(() => {
  if (props.history.length === 0) return '-';
  
  const counts = {};
  props.history.forEach(item => {
    counts[item.topic] = (counts[item.topic] || 0) + 1;
  });
  
  let maxTopic = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([topic, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxTopic = topic;
    }
  });
  
  return getTopicLabel(maxTopic);
});

// 话题标签映射
const getTopicLabel = (topicId) => {
  const labels = {
    'bored': '无聊',
    'curious': '好奇',
    'care': '关心',
    'hungry': '饿了',
    'brag': '炫耀',
    'tease': '调侃',
    'tsundere': '傲娇',
    'question': '提问',
    'share': '分享',
    'complain': '抱怨',
    'cheer': '鼓励',
    'praise': '夸奖'
  };
  return labels[topicId] || topicId;
};

// 触发原因标签
const getReasonLabel = (reason) => {
  const labels = {
    'idle': '💤 空闲触发',
    'random': '🎲 随机触发',
    'test': '🧪 测试触发'
  };
  return labels[reason] || reason;
};

// 情绪 emoji
const getEmotionEmoji = (emotion) => {
  const emojis = {
    'bored': '😑',
    'curious': '🧐',
    'care': '💕',
    'hungry': '🍖',
    'proud': '😎',
    'playful': '😏',
    'tsundere': '😤',
    'excited': '🤩',
    'grumpy': '😒',
    'supportive': '💪'
  };
  return emojis[emotion] || '👻';
};

// 情绪样式类
const getEmotionClass = (emotion) => {
  const classes = {
    'care': 'emotion-care',
    'proud': 'emotion-proud',
    'playful': 'emotion-playful',
    'grumpy': 'emotion-grumpy',
    'supportive': 'emotion-supportive'
  };
  return classes[emotion] || '';
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60000) return '刚刚';
  // 1小时内
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  // 24小时内
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  // 超过24小时显示日期
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 清空历史
const handleClear = () => {
  uni.showModal({
    title: '确认清空',
    content: '将删除所有随机互动历史，此操作不可恢复',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        emit('clear');
        uni.showToast({ title: '已清空', icon: 'success' });
      }
    }
  });
};
</script>

<style lang="scss" scoped>
$bg-dark: #1a1a2e;
$card-bg: #2f3542;
$text-light: #f1f2f6;
$text-dim: #747d8c;

.history-container {
  padding: 15px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.stats-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 12px;
  background: $card-bg;
  border-radius: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #2ed573;
}

.stat-label {
  font-size: 11px;
  color: $text-dim;
  margin-top: 2px;
}

.history-list {
  flex: 1;
  max-height: 400px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: $text-dim;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 5px;
}

.empty-hint {
  font-size: 12px;
  color: lighten($text-dim, 10%);
}

.history-item {
  background: $card-bg;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  border-left: 3px solid #667eea;
}

.emotion-care { border-left-color: #ff6b81; }
.emotion-proud { border-left-color: #ffd700; }
.emotion-playful { border-left-color: #7bed9f; }
.emotion-grumpy { border-left-color: #ff6348; }
.emotion-supportive { border-left-color: #1e90ff; }

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-emotion {
  font-size: 18px;
}

.item-topic {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
}

.item-time {
  font-size: 10px;
  color: $text-dim;
  margin-left: auto;
}

.item-text {
  font-size: 14px;
  color: $text-light;
  line-height: 1.5;
  word-break: break-all;
}

.item-footer {
  margin-top: 8px;
}

.item-reason {
  font-size: 10px;
  color: $text-dim;
}

.actions {
  margin-top: 15px;
}

.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  color: #fff;
  border: none;
}

.clear-btn {
  background: linear-gradient(135deg, #ff4757, #ff6b6b);
}
</style>
