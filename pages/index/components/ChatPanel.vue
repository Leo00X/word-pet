<template>
  <view class="chat-panel">
    <scroll-view 
      class="messages-scroll" 
      scroll-y 
      :scroll-into-view="scrollToView" 
      scroll-with-animation
    >
      <view class="messages-container">
        <view v-if="!hasMessages" class="empty-state">
          <text class="empty-icon">💬</text>
          <text class="empty-text">还没有对话记录</text>
          <text class="empty-hint">试试下面的快捷回复开始聊天吧</text>
        </view>
        
        <!-- 加载更多按钮 -->
        <view v-if="canLoadMore" class="load-more-btn" @tap="loadMore">
          <text class="load-more-icon">⬆</text>
          <text class="load-more-text">加载更早的消息 ({{ hiddenCount }}条)</text>
        </view>
        
        <view 
          v-for="(msg, index) in displayMessages" 
          :key="msg.id"
          :id="'msg-' + index"
        >
          <ChatBubble
            :role="msg.role"
            :content="msg.content"
            :timestamp="msg.timestamp"
            :emotion="msg.metadata?.emotion || 'normal'"
            :petEmoji="petEmoji"
          />
        </view>
      </view>
    </scroll-view>

    <view class="quick-replies">
      <view 
        v-for="reply in quickReplies"
        :key="reply.id"
        class="quick-reply-btn"
        @tap="handleQuickReply(reply.id)"
      >
        <text class="reply-icon">{{ reply.icon }}</text>
        <text class="reply-text">{{ reply.text }}</text>
      </view>
    </view>

    <view class="input-area">
      <input
        class="message-input"
        :value="userInputValue"
        @input="handleInput"
        placeholder="输入消息..."
        :disabled="isSendingValue"
        @confirm="handleSend"
        confirm-type="send"
      />
      <button 
        class="send-btn"
        :class="{ 'send-btn-active': userInputValue.trim() }"
        :disabled="!userInputValue.trim() || isSendingValue"
        @tap="handleSend"
      >
        <text v-if="isSendingValue">...</text>
        <text v-else>→</text>
      </button>
    </view>
  </view>
</template>

<script>
import ChatBubble from './ChatBubble.vue';

export default {
  components: {
    ChatBubble
  },

  props: {
    messages: {
      required: true
    },
    userInput: {
      required: true
    },
    isSending: {
      required: true
    },
    quickReplies: {
      type: Array,
      default: () => []
    },
    petEmoji: {
      type: String,
      default: '👻'
    }
  },

  data() {
    return {
      scrollToView: '',
      showCount: 3  // 默认显示最近3条消息
    };
  },

  computed: {
    messagesValue() {
      const val = this.messages?.value !== undefined ? this.messages.value : this.messages;
      return Array.isArray(val) ? val : [];
    },
    
    userInputValue() {
      return this.userInput?.value !== undefined ? this.userInput.value : (this.userInput || '');
    },
    
    isSendingValue() {
      return this.isSending?.value !== undefined ? this.isSending.value : this.isSending;
    },
    
    hasMessages() {
      return this.messagesValue.length > 0;
    },
    
    displayMessages() {
      const total = this.messagesValue.length;
      // 如果消息数少于等于 showCount，全部显示
      if (total <= this.showCount) {
        return this.messagesValue;
      }
      // 否则只显示最近的 showCount 条
      return this.messagesValue.slice(total - this.showCount);
    },
    
    canLoadMore() {
      return this.messagesValue.length > this.showCount;
    },
    
    hiddenCount() {
      return this.messagesValue.length - this.showCount;
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.scrollToBottom();
    });
  },

  methods: {
    handleInput(e) {
      this.$emit('update:userInput', e.detail.value);
    },
    
    handleSend() {
      const inputValue = this.userInputValue;
      if (!inputValue.trim() || this.isSendingValue) {
        return;
      }
      this.$emit('send-message', inputValue);
    },
    
    handleQuickReply(replyId) {
      this.$emit('quick-reply', replyId);
    },
    
    loadMore() {
      // 增加显示数量，一次加载10条
      this.showCount += 10;
    },
    
    scrollToBottom() {
      const lastIndex = this.displayMessages.length - 1;
      if (lastIndex >= 0) {
        this.scrollToView = 'msg-' + lastIndex;
      }
    }
  },
  
  watch: {
    messages: {
      handler(newVal, oldVal) {
        const newLength = (newVal?.value?.length || newVal?.length || 0);
        const oldLength = (oldVal?.value?.length || oldVal?.length || 0);
        
        // 如果有新消息，重置为显示最近3条（保持简洁）
        if (newLength > oldLength) {
          this.showCount = 3;
        }
        
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true
    }
  }
};
</script>

<style lang="scss" scoped>
// 配色变量
$bg-dark: #0a0f1a;
$bg-card: #111827;
$bg-elevated: #1a2744;
$accent-cyan: #00d9ff;
$accent-purple: #7b68ee;
$accent-orange: #ff9500;
$text-light: #f0f0f0;
$text-dim: #6b7280;

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(180deg, $bg-card 0%, $bg-dark 100%);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba($accent-cyan, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.messages-scroll {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($accent-cyan, 0.3);
    border-radius: 2px;
  }
}

.messages-container {
  min-height: 100%;
  padding-bottom: 10px;
  padding-right: 8px;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  
  .empty-icon {
    font-size: 50px;
    margin-bottom: 16px;
    opacity: 0.6;
    animation: float 3s ease-in-out infinite;
  }
  
  .empty-text {
    font-size: 15px;
    color: $text-light;
    margin-bottom: 8px;
  }
  
  .empty-hint {
    font-size: 12px;
    color: $text-dim;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// 加载更多按钮
.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  margin: 12px auto;
  background: linear-gradient(135deg, rgba($accent-cyan, 0.1), rgba($accent-purple, 0.1));
  border: 1px solid rgba($accent-cyan, 0.25);
  border-radius: 25px;
  color: $accent-cyan;
  font-size: 12px;
  max-width: 180px;
  transition: all 0.3s ease;
  
  .load-more-icon {
    margin-right: 8px;
    font-size: 12px;
  }
  
  &:active {
    transform: scale(0.96);
    background: rgba($accent-cyan, 0.2);
  }
}

// 快捷回复区域
.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid rgba($accent-cyan, 0.1);
  background: linear-gradient(180deg, rgba($bg-elevated, 0.5), rgba($bg-dark, 0.8));
}

.quick-reply-btn {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba($accent-cyan, 0.08), rgba($accent-purple, 0.08));
  border: 1px solid rgba($accent-cyan, 0.2);
  border-radius: 18px;
  font-size: 12px;
  color: $accent-cyan;
  transition: all 0.25s ease;
  
  .reply-icon {
    margin-right: 6px;
    font-size: 14px;
  }
  
  &:active {
    transform: scale(0.95);
    background: rgba($accent-cyan, 0.15);
    border-color: rgba($accent-cyan, 0.4);
  }
}

// 输入区域
.input-area {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-top: 1px solid rgba($accent-cyan, 0.1);
  background: linear-gradient(180deg, rgba($bg-dark, 0.9), $bg-dark);
}

.message-input {
  flex: 1;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($accent-cyan, 0.2);
  border-radius: 24px;
  color: $text-light;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: rgba($accent-cyan, 0.5);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 3px rgba($accent-cyan, 0.1);
  }
  
  &::placeholder {
    color: $text-dim;
  }
}

.send-btn {
  width: 44px;
  height: 44px;
  margin-left: 10px;
  background: linear-gradient(135deg, rgba($accent-cyan, 0.2), rgba($accent-purple, 0.2));
  border: 1px solid rgba($accent-cyan, 0.3);
  border-radius: 50%;
  color: $text-dim;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &.send-btn-active {
    background: linear-gradient(135deg, $accent-cyan, $accent-purple);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 15px rgba($accent-cyan, 0.4);
    
    &:active {
      transform: scale(0.92);
    }
  }
}
</style>
