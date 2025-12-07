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
    }
  },
  methods: {
    handleIntervalChange(e) {
      this.$emit('interval-change', e.detail.value);
    },
    handleRandomChatToggle(e) {
      this.$emit('toggle-random-chat', e.detail.value);
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
$text-dim: #747d8c;

/* 配置项 */
.setting-item {
  display: flex; 
  align-items: center;
  background: #2f3542;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.icon-box { 
  font-size: 20px; 
  margin-right: 12px; 
}

.setting-text { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
}

.main-text { 
  font-size: 14px; 
  font-weight: bold; 
}

.sub-text { 
  font-size: 10px; 
  color: $text-dim; 
  margin-top: 2px; 
}

.arrow { 
  color: $text-dim; 
}

.setting-block { 
  background: #2f3542; 
  padding: 12px; 
  border-radius: 8px; 
  margin-top: 20px; 
}

.block-title { 
  display: block; 
  font-size: 12px; 
  color: $text-dim; 
  margin-bottom: 10px; 
}

.game-btn {
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}

.terminal-btn { 
  background: #2f3542; 
  border: 1px solid #57606f; 
  margin-top: 20px; 
  font-size: 12px; 
}

.clear-btn {
  background: #ff4757;
  margin-top: 12px;
  font-size: 12px;
}

/* 开发者测试区域 */
.dev-section {
  margin-top: 30px;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px dashed #ffd700;
  border-radius: 8px;
}

.dev-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.dev-btn {
  flex: 1;
  background: linear-gradient(135deg, #2ed573, #1e90ff);
  border: none;
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  color: #fff;
  font-weight: bold;
}
</style>
