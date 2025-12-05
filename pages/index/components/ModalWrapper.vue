<template>
  <view 
    v-if="visible" 
    class="modal-overlay" 
    @tap="handleClose"
  >
    <view 
      :class="['modal-content', contentClass]" 
      @tap.stop
    >
      <!-- 头部（可选） -->
      <view class="modal-header" v-if="showHeader">
        <text class="modal-title">{{ title }}</text>
        <text class="modal-close" @tap="handleClose">✕</text>
      </view>
      
      <!-- 内容区 -->
      <view class="modal-body">
        <slot />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ModalWrapper',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    contentClass: {
      type: String,
      default: ''
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    }
  },

  methods: {
    handleClose() {
      if (this.closeOnOverlay) {
        this.$emit('close');
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 90%;
  max-width: 400px;
  max-height: 85vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f1526 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 217, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 217, 255, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #00d9ff;
}

.modal-close {
  font-size: 20px;
  color: #747d8c;
  padding: 5px;
}

.modal-body {
  overflow-y: auto;
  max-height: calc(85vh - 60px);
}

/* 扩展类 */
.modal-content.skin-modal {
  max-width: 420px;
}

.modal-content.market-modal {
  max-height: 90vh;
}

.modal-content.backup-modal {
  max-width: 380px;
}

.modal-content.game-modal {
  max-width: 380px;
  max-height: 90vh;
}
</style>
