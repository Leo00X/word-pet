<template>
  <view class="chat-bubble" :class="bubbleClass">
    <view class="bubble-avatar">
      <text class="avatar-icon">{{ avatarIcon }}</text>
    </view>
    <view class="bubble-content">
      <view class="bubble-header">
        <text class="sender-name">{{ senderName }}</text>
        <text class="timestamp">{{ formatTime(timestamp) }}</text>
      </view>
      <view class="bubble-text">
        {{ content }}
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    role: {
      type: String,
      required: true,
      validator: (val) => ['user', 'pet', 'system'].includes(val)
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    },
    emotion: {
      type: String,
      default: 'normal'
    },
    petEmoji: {
      type: String,
      default: '👻'
    }
  },

  computed: {
    bubbleClass() {
      return [
        `bubble-${this.role}`,
        this.role === 'pet' ? `bubble-emotion-${this.emotion}` : ''
      ];
    },
    
    avatarIcon() {
      if (this.role === 'user') return '👤';
      if (this.role === 'system') return '⚙️';
      return this.petEmoji;
    },
    
    senderName() {
      if (this.role === 'user') return '你';
      if (this.role === 'system') return '系统';
      return 'WordParasite';
    }
  },

  methods: {
    formatTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}分钟前`;
      }
      
      const date = new Date(timestamp);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
      }
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}-${day}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-bubble {
  display: flex;
  margin-bottom: 10px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-avatar {
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(0, 217, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  
  .avatar-icon {
    font-size: 20px;
  }
}

.bubble-content {
  flex: 1;
  max-width: 75%;
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  
  .sender-name {
    font-size: 11px;
    color: #00d9ff;
    font-weight: bold;
  }
  
  .timestamp {
    font-size: 10px;
    color: #666;
  }
}

.bubble-text {
  background: rgba(22, 33, 62, 0.8);
  padding: 8px 12px;
  border-radius: 10px;
  color: #f1f2f6;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
  border: 1px solid rgba(0, 217, 255, 0.3);
}

.bubble-user {
  flex-direction: row-reverse;
  
  .bubble-avatar {
    margin-right: 0;
    margin-left: 8px;
    background: rgba(255, 170, 0, 0.2);
  }
  
  .bubble-content {
    text-align: right;
  }
  
  .bubble-text {
    background: rgba(255, 170, 0, 0.2);
    border-color: rgba(255, 170, 0, 0.4);
  }
  
  .bubble-header .sender-name {
    color: #ffaa00;
  }
}

.bubble-system {
  justify-content: center;
  
  .bubble-avatar {
    background: rgba(102, 102, 102, 0.2);
  }
  
  .bubble-text {
    background: rgba(50, 50, 50, 0.5);
    border-color: #666;
    font-size: 12px;
    text-align: center;
  }
  
  .bubble-header .sender-name {
    color: #999;
  }
}

.bubble-emotion-happy .bubble-text {
  border-color: rgba(0, 255, 136, 0.5);
  background: rgba(0, 255, 136, 0.1);
}

.bubble-emotion-angry .bubble-text {
  border-color: rgba(255, 51, 102, 0.5);
  background: rgba(255, 51, 102, 0.1);
}
</style>
