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
$bg-color: #1a1a2e;
$card-bg: #16213e;
$accent-color: #00d9ff;

.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $card-bg;
  border-radius: 15px;
  overflow: hidden;
}

.messages-scroll {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.messages-container {
  min-height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  
  .empty-icon {
    font-size: 60px;
    margin-bottom: 15px;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 16px;
    margin-bottom: 8px;
  }
  
  .empty-hint {
    font-size: 12px;
    opacity: 0.7;
  }
}

.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  margin: 10px auto;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 20px;
  color: $accent-color;
  font-size: 12px;
  max-width: 200px;
  
  .load-more-icon {
    margin-right: 8px;
    font-size: 14px;
  }
  
  &:active {
    background: rgba(0, 217, 255, 0.2);
  }
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 217, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.quick-reply-btn {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 15px;
  font-size: 12px;
  color: $accent-color;
  
  .reply-icon {
    margin-right: 5px;
  }
  
  &:active {
    background: rgba(0, 217, 255, 0.2);
  }
}

.input-area {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 217, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
}

.message-input {
  flex: 1;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 20px;
  color: #f1f2f6;
  font-size: 14px;
}

.send-btn {
  width: 40px;
  height: 40px;
  margin-left: 10px;
  background: rgba(0, 217, 255, 0.2);
  border: 1px solid rgba(0, 217, 255, 0.3);
  border-radius: 50%;
  color: #666;
  font-size: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.send-btn-active {
    background: rgba(0, 217, 255, 0.3);
    color: $accent-color;
  }
  
  &:active {
    background: rgba(0, 217, 255, 0.5);
  }
}
</style>
