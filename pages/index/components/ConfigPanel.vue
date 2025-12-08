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

    <view class="setting-item" @click="showPetSelector">
      <view class="icon-box">🐾</view>
      <view class="setting-text">
        <text class="main-text">宠物类型</text>
        <text class="sub-text">选择你喜欢的宠物形象</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="$emit('open-skin-selector')">
      <view class="icon-box">🎨</view>
      <view class="setting-text">
        <text class="main-text">皮肤管理</text>
        <text class="sub-text">切换宠物外观和动画效果</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="$emit('open-skin-market')">
      <view class="icon-box">🛒</view>
      <view class="setting-text">
        <text class="main-text">皮肤商城</text>
        <text class="sub-text">购买和解锁更多皮肤</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="navigateToPersonality">
      <view class="icon-box">🎭</view>
      <view class="setting-text">
        <text class="main-text">宠物人格</text>
        <text class="sub-text">动态性格·演化历史</text>
      </view>
      <text class="arrow">></text>
    </view>

    <!-- 认知核心 (HCDS) -->
    <view class="setting-item" @tap="navigateToCognitive">
      <view class="icon-box">🧠</view>
      <view class="setting-text">
        <text class="main-text">认知核心</text>
        <text class="sub-text">记忆·思维·向量引擎</text>
      </view>
      <text class="arrow">></text>
    </view>

    <view class="setting-item" @click="$emit('open-backup')">
      <view class="icon-box">☁️</view>
      <view class="setting-text">
        <text class="main-text">数据备份</text>
        <text class="sub-text">导出导入或云端同步</text>
      </view>
      <text class="arrow">></text>
    </view>

    <!-- 随机互动开关 -->
    <view class="setting-item switch-item">
      <view class="icon-box">🎲</view>
      <view class="setting-text">
        <text class="main-text">随机 AI 互动</text>
        <text class="sub-text">宠物会主动找你聊天</text>
      </view>
      <switch 
        :checked="randomChatEnabled" 
        @change="handleRandomChatToggle"
        color="#2ed573"
      />
    </view>

    <!-- 随机互动历史 -->
    <view class="setting-item" @click="$emit('open-random-history')">
      <view class="icon-box">📜</view>
      <view class="setting-text">
        <text class="main-text">互动历史</text>
        <text class="sub-text">查看宠物主动说话记录 ({{ randomChatHistoryCount }}条)</text>
      </view>
      <text class="arrow">></text>
    </view>

    <!-- 分层宠物模式开关 -->
    <view class="setting-item switch-item">
      <view class="icon-box">🧩</view>
      <view class="setting-text">
        <text class="main-text">分层宠物模式</text>
        <text class="sub-text">启用头/身体/四肢部位交互</text>
      </view>
      <switch 
        :checked="partedModeEnabled" 
        @change="handlePartedModeToggle"
        color="#ff66cc"
      />
    </view>

    <!-- Live2D 渲染模式 -->
    <view class="setting-item" @click="showRenderModeSelector">
      <view class="icon-box">✨</view>
      <view class="setting-text">
        <text class="main-text">渲染模式</text>
        <text class="sub-text">当前: {{ renderModeLabel }}</text>
      </view>
      <text class="arrow">></text>
    </view>

    <!-- Live2D 模型选择 (仅在 Live2D 模式下显示) -->
    <view class="setting-item" v-if="petRenderMode === 'live2d'" @click="showLive2dModelSelector">
      <view class="icon-box">🎀</view>
      <view class="setting-text">
        <text class="main-text">Live2D 模型</text>
        <text class="sub-text">当前: {{ live2dModelLabel }}</text>
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
    
    <button class="game-btn clear-btn" @click="confirmClearChat">
      <text>🗑️ 清除聊天记录</text>
    </button>

    <!-- 开发者测试按钮 -->
    <view class="dev-section">
      <text class="block-title">🛠️ 开发者模式</text>
      <view class="dev-buttons">
        <button class="dev-btn" @click="quickLevelUp">
          <text>⬆️ 升10级</text>
        </button>
        <button class="dev-btn" @click="addCoins">
          <text>🪙 +500金币</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ConfigPanel',
  props: {
    monitorIntervalTime: {
      type: Number,
      default: 3000
    },
    randomChatEnabled: {
      type: Boolean,
      default: true
    },
    randomChatHistoryCount: {
      type: Number,
      default: 0
    },
    partedModeEnabled: {
      type: Boolean,
      default: false
    },
    petRenderMode: {
      type: String,
      default: 'v1'  // 'v1' | 'v2' | 'live2d'
    },
    currentLive2dModel: {
      type: String,
      default: 'hiyori'  // 'hiyori' | 'shizuku'
    }
  },
  computed: {
    renderModeLabel() {
      const labels = {
        'v1': '经典模式',
        'v2': '分层模式 (v2)',
        'live2d': 'Live2D 🌟'
      };
      return labels[this.petRenderMode] || '经典模式';
    },
    live2dModelLabel() {
      const labels = {
        'hiyori': '🎀 Hiyori (短发校服)',
        'shizuku': '🌸 Shizuku (长发制服)'
      };
      return labels[this.currentLive2dModel] || 'Hiyori';
    }
  },
  methods: {
    handleIntervalChange(e) {
      this.$emit('interval-change', e.detail.value);
    },
    handleRandomChatToggle(e) {
      this.$emit('toggle-random-chat', e.detail.value);
    },
    handlePartedModeToggle(e) {
      this.$emit('toggle-parted-mode', e.detail.value);
    },
    showRenderModeSelector() {
      const modes = [
        { id: 'v1', name: '👻 经典模式', desc: '简洁稳定' },
        { id: 'v2', name: '🧩 分层模式', desc: '部位交互' },
        { id: 'live2d', name: '✨ Live2D', desc: '高清动画（实验性）' }
      ];
      
      uni.showActionSheet({
        itemList: modes.map(m => `${m.name} - ${m.desc}`),
        success: (res) => {
          const selected = modes[res.tapIndex];
          this.$emit('change-render-mode', selected.id);
          uni.showToast({ 
            title: `已切换为${selected.name}`, 
            icon: 'none' 
          });
        }
      });
    },
    showLive2dModelSelector() {
      const models = [
        { id: 'hiyori', name: '🎀 Hiyori', desc: '短发校服女生' },
        { id: 'shizuku', name: '🌸 Shizuku', desc: '长发制服女生' }
      ];
      
      uni.showActionSheet({
        itemList: models.map(m => `${m.name} - ${m.desc}`),
        success: (res) => {
          const selected = models[res.tapIndex];
          this.$emit('change-live2d-model', selected.id);
          uni.showToast({ 
            title: `切换到 ${selected.name}`, 
            icon: 'none' 
          });
        }
      });
    },
    navigateToAISelector() {
      uni.navigateTo({
        url: '/pages/config/ai-selector'
      });
    },
    confirmClearChat() {
      uni.showModal({
        title: '确认清除',
        content: '将删除所有聊天记录，此操作不可恢复',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.$emit('clear-chat');
            uni.showToast({ title: '已清除', icon: 'success' });
          }
        }
      });
    },
    showPetSelector() {
      const pets = [
        { id: 'ghost', name: '👻 幽灵', desc: '神秘的电子幽灵' },
        { id: 'dog', name: '🐕 中华田园犬', desc: '忠诚的守护犬' },
        { id: 'cockatiel', name: '🦜 玄凤鹦鹉', desc: '活泼的小鸟' },
        { id: 'monk_parakeet', name: '🦜 和尚鹦鹉', desc: '聪明的鹦鹉' }
      ];
      
      uni.showActionSheet({
        itemList: pets.map(p => p.name),
        success: (res) => {
          const selected = pets[res.tapIndex];
          this.$emit('change-pet-type', selected.id);
          uni.showToast({ 
            title: `已切换为${selected.name}`, 
            icon: 'none' 
          });
        }
      });
    },
    navigateToPersonality() {
      uni.navigateTo({
        url: '/pages/personality/personality'
      });
    },
    navigateToCognitive() {
      uni.navigateTo({
        url: '/pages/debug/cognitive'
      });
    },
    // 开发者测试：快速升10级
    quickLevelUp() {
      for (let i = 0; i < 10; i++) {
        const level = uni.getStorageSync('pet_level') || 1;
        uni.setStorageSync('pet_level', level + 1);
      }
      const newLevel = uni.getStorageSync('pet_level') || 1;
      uni.showToast({ title: `当前等级: ${newLevel}`, icon: 'success' });
      // 刷新页面使生效
      this.$emit('dev-refresh');
    },
    // 开发者测试：添加500金币
    addCoins() {
      const coins = uni.getStorageSync('pet_coins') || 0;
      uni.setStorageSync('pet_coins', coins + 500);
      uni.showToast({ title: `+500 金币`, icon: 'success' });
      this.$emit('dev-refresh');
    }
  }
}
</script>

<style lang="scss" scoped>
.setting-item {
  display: flex; 
  align-items: center;
  background: linear-gradient(135deg, rgba($bg-elevated, 0.8), rgba($bg-card, 0.8));
  padding: 14px;
  border-radius: $radius-md;
  margin-bottom: 10px;
  border: 1px solid rgba($cyber-primary, 0.08);
  transition: all $transition-normal $ease-smooth;
  
  &:active {
    transform: scale(0.98);
    background: rgba($cyber-primary, 0.08);
    border-color: rgba($cyber-primary, 0.25);
  }
}

.switch-item {
  &:active {
    transform: none;
  }
}

.icon-box { 
  font-size: 22px; 
  margin-right: 14px;
  transition: transform $transition-normal $ease-bounce;
}

.setting-item:active .icon-box {
  transform: scale(1.15);
}

.setting-text { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.main-text { 
  font-size: 14px; 
  font-weight: bold;
  color: $text-light;
}

.sub-text { 
  font-size: 10px; 
  color: $text-dim; 
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.arrow { 
  color: $text-dim;
  font-size: 14px;
  transition: transform $transition-fast;
}

.setting-item:active .arrow {
  transform: translateX(3px);
}

.setting-block { 
  background: linear-gradient(180deg, rgba($bg-elevated, 0.9), rgba($bg-card, 0.7));
  padding: 14px; 
  border-radius: $radius-md; 
  margin-top: $space-lg;
  border: 1px solid rgba($cyber-primary, 0.1);
}

.block-title { 
  display: block; 
  font-size: 12px; 
  color: $text-dim; 
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.game-btn {
  border: none;
  border-radius: $radius-md;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  transition: all $transition-fast $ease-smooth;

  &:active {
    transform: translateY(4px);
    box-shadow: none;
  }
}

.terminal-btn { 
  background: linear-gradient(135deg, rgba($bg-elevated, 0.9), rgba($bg-dark, 0.9));
  border: 1px solid rgba($cyber-primary, 0.3);
  margin-top: $space-lg; 
  font-size: 12px;
  color: $cyber-primary;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2), $shadow-glow-cyan;
}

.clear-btn {
  background: $gradient-danger;
  margin-top: 12px;
  font-size: 12px;
  box-shadow: 0 4px 0 darken($cyber-danger, 20%), $shadow-glow-red;
}

/* 开发者测试区域 */
.dev-section {
  margin-top: $space-xl;
  padding: $space-md;
  background: rgba(#ffd700, 0.08);
  border: 1px dashed rgba(#ffd700, 0.5);
  border-radius: $radius-md;
}

.dev-buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.dev-btn {
  flex: 1;
  background: $gradient-cyber;
  border: none;
  border-radius: $radius-sm;
  padding: 10px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2), $shadow-glow-cyan;
  transition: all $transition-fast $ease-smooth;

  &:active {
    transform: translateY(3px);
    box-shadow: none;
  }
}
</style>
