<template>
  <view class="chat-bubble" :class="bubbleClass">
    <!-- 头像区域 -->
    <view class="bubble-avatar" :class="avatarClass">
      <view class="avatar-glow"></view>
      <text class="avatar-icon">{{ avatarIcon }}</text>
    </view>
    
    <!-- 消息内容 -->
    <view class="bubble-main">
      <view class="bubble-header">
        <text class="sender-name">{{ senderName }}</text>
        <text class="timestamp">{{ formatTime(timestamp) }}</text>
      </view>
      <view class="bubble-text">
        <rich-text :nodes="formattedContent"></rich-text>
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
    
    avatarClass() {
      return `avatar-${this.role}`;
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
    },
    
    // 增强的 Markdown 渲染
    formattedContent() {
      let text = this.content;
      
      // 1. 处理加粗 **文本**
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#00d9ff;font-weight:600;">$1</strong>');
      
      // 2. 处理列表项 * 开头 或 - 开头
      // 将 "* 文本" 或 "- 文本" 转换为带圆点的列表项
      text = text.replace(/^[\*\-]\s+(.+)$/gm, '<span style="display:flex;align-items:flex-start;margin:4px 0;"><span style="color:#00d9ff;margin-right:8px;font-size:8px;">●</span><span style="flex:1;">$1</span></span>');
      
      // 3. 处理换行
      text = text.replace(/\n/g, '<br>');
      
      // 4. 处理 emoji 后的多余换行
      text = text.replace(/<br><br>/g, '<br>');
      
      return text;
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
// 配色变量
$pet-primary: #00d9ff;
$pet-secondary: #7b68ee;
$user-primary: #ff9500;
$user-secondary: #ff6b6b;
$bg-dark: #0f1729;
$bg-card: #1a2744;
$text-light: #e8e8e8;
$text-dim: #8892a6;

.chat-bubble {
  display: flex;
  margin-bottom: 16px;
  padding-right: 5px;  // 确保右侧头像不被裁剪
  animation: slideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// ========== 头像区域 ==========
.bubble-avatar {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  position: relative;
  overflow: visible;
  
  .avatar-glow {
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    border-radius: 50%;
    opacity: 0.6;
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
  }
  
  .avatar-icon {
    font-size: 24px;
    line-height: 1;
    z-index: 2;
    display: block;
    text-align: center;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.3; }
}

// 宠物头像样式
.avatar-pet {
  background: linear-gradient(135deg, rgba($pet-primary, 0.3), rgba($pet-secondary, 0.3));
  border: 2px solid rgba($pet-primary, 0.5);
  box-shadow: 0 0 15px rgba($pet-primary, 0.3);
  
  .avatar-glow {
    background: radial-gradient(circle, rgba($pet-primary, 0.4), transparent 70%);
  }
}

// 用户头像样式
.avatar-user {
  background: linear-gradient(135deg, rgba($user-primary, 0.3), rgba($user-secondary, 0.3));
  border: 2px solid rgba($user-primary, 0.5);
  box-shadow: 0 0 15px rgba($user-primary, 0.3);
  
  .avatar-glow {
    background: radial-gradient(circle, rgba($user-primary, 0.4), transparent 70%);
  }
}

// 系统头像样式
.avatar-system {
  background: rgba(100, 100, 100, 0.3);
  border: 2px solid rgba(150, 150, 150, 0.5);
  
  .avatar-glow { display: none; }
}

// ========== 消息主体 ==========
.bubble-main {
  flex: 1;
  max-width: 60%;  // 进一步减小，确保头像完整显示
  min-width: 0;    // 防止flex溢出
}

.bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 4px;
  
  .sender-name {
    font-size: 12px;
    font-weight: 600;
    background: linear-gradient(90deg, $pet-primary, $pet-secondary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .timestamp {
    font-size: 10px;
    color: $text-dim;
  }
}

.bubble-text {
  background: linear-gradient(145deg, rgba($bg-card, 0.95), rgba($bg-dark, 0.9));
  padding: 12px 16px;
  border-radius: 4px 18px 18px 18px;
  color: $text-light;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  border: 1px solid rgba($pet-primary, 0.25);
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  position: relative;
  
  // 左上角装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 20px;
    background: linear-gradient(180deg, $pet-primary, transparent);
    border-radius: 2px 0 0 0;
  }
}

// ========== 用户气泡样式 ==========
.bubble-user {
  flex-direction: row-reverse;
  
  .bubble-avatar {
    margin-right: 0;
    margin-left: 8px;  // 减小间距
    flex-shrink: 0;    // 防止头像被压缩
  }
  
  .bubble-main {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .bubble-header {
    flex-direction: row-reverse;
    
    .sender-name {
      background: linear-gradient(90deg, $user-primary, $user-secondary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .timestamp {
      margin-right: 0;
      margin-left: auto;
    }
  }
  
  .bubble-text {
    background: linear-gradient(145deg, rgba($user-primary, 0.15), rgba($user-secondary, 0.1));
    border-color: rgba($user-primary, 0.35);
    border-radius: 18px 4px 18px 18px;
    
    &::before {
      left: auto;
      right: 0;
      background: linear-gradient(180deg, $user-primary, transparent);
      border-radius: 0 2px 0 0;
    }
  }
}

// ========== 系统消息样式 ==========
.bubble-system {
  justify-content: center;
  
  .bubble-main {
    max-width: 90%;
    text-align: center;
  }
  
  .bubble-header .sender-name {
    background: none;
    -webkit-text-fill-color: $text-dim;
    color: $text-dim;
  }
  
  .bubble-text {
    background: rgba(60, 60, 70, 0.5);
    border-color: rgba(100, 100, 100, 0.3);
    border-radius: 12px;
    font-size: 12px;
    padding: 8px 14px;
    
    &::before { display: none; }
  }
}

// ========== 情绪样式 ==========
.bubble-emotion-happy .bubble-text {
  border-color: rgba(0, 255, 136, 0.4);
  box-shadow: 
    0 4px 15px rgba(0, 255, 136, 0.15),
    inset 0 1px 0 rgba(0, 255, 136, 0.1);
    
  &::before {
    background: linear-gradient(180deg, #00ff88, transparent);
  }
}

.bubble-emotion-angry .bubble-text {
  border-color: rgba(255, 51, 102, 0.4);
  box-shadow: 
    0 4px 15px rgba(255, 51, 102, 0.15),
    inset 0 1px 0 rgba(255, 51, 102, 0.1);
    
  &::before {
    background: linear-gradient(180deg, #ff3366, transparent);
  }
}

.bubble-emotion-thinking .bubble-text {
  border-color: rgba(123, 104, 238, 0.4);
  
  &::before {
    background: linear-gradient(180deg, #7b68ee, transparent);
  }
}
</style>
