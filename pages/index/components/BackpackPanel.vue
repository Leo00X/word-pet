<template>
  <view class="backpack-panel">
    <view class="backpack-header">
      <text class="header-title">🎒 我的背包</text>
      <view class="coin-display">
        <text class="coin-icon">🪙</text>
        <text class="coin-amount">{{ coins }}</text>
      </view>
    </view>
    
    <view class="items-grid">
      <view 
        v-for="item in items" 
        :key="item.id" 
        class="item-slot"
        :class="{ 'has-item': item.count > 0, 'selected': selectedItem === item.id }"
        @tap="selectItem(item)"
      >
        <text class="item-icon">{{ item.icon }}</text>
        <text class="item-name">{{ item.name }}</text>
        <text class="item-count" v-if="item.count > 0">x{{ item.count }}</text>
        <text class="item-count empty" v-else>x0</text>
      </view>
    </view>
    
    <view class="item-detail" v-if="selectedItem">
      <view class="detail-info">
        <text class="detail-icon">{{ selectedItemData.icon }}</text>
        <view class="detail-text">
          <text class="detail-name">{{ selectedItemData.name }}</text>
          <text class="detail-desc">{{ selectedItemData.description }}</text>
        </view>
      </view>
      <button 
        class="use-btn" 
        :disabled="selectedItemData.count <= 0"
        @tap="useItem"
      >
        使用
      </button>
    </view>
    
    <view class="shop-preview">
      <view class="shop-banner">
        <text class="shop-icon">🏪</text>
        <text class="shop-text">商城入口</text>
        <text class="coming-soon">敬请期待</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BackpackPanel',
  props: {
    coins: {
      type: Number,
      default: 0
    }
  },
  
  data() {
    return {
      selectedItem: null,
      items: [
        { id: 'food', icon: '🍖', name: '食物', description: '恢复20点饥饿度', count: 3, effect: { hunger: 20 } },
        { id: 'potion', icon: '💊', name: '心情药水', description: '恢复15点心情值', count: 1, effect: { mood: 15 } },
        { id: 'gift', icon: '🎁', name: '礼物', description: '增加10点亲密度', count: 0, effect: { bond: 10 } },
        { id: 'expbook', icon: '⭐', name: '经验书', description: '增加50点经验值', count: 2, effect: { exp: 50 } },
        { id: 'treat', icon: '🍬', name: '零食', description: '恢复5点饥饿度和5点心情', count: 5, effect: { hunger: 5, mood: 5 } },
        { id: 'toy', icon: '🧸', name: '玩具', description: '增加5点亲密度和5点心情', count: 0, effect: { bond: 5, mood: 5 } },
        { id: 'game_ticket', icon: '🎮', name: '游戏券', description: '开始猜单词挑战！赢取经验和金币', count: 99, effect: null }
      ]
    };
  },
  
  mounted() {
    // 从本地存储加载背包数据
    this.loadBackpack();
  },
  
  watch: {
    // 监听items变化，自动保存
    items: {
      handler(newItems) {
        this.saveBackpack();
      },
      deep: true
    }
  },
  
  computed: {
    selectedItemData() {
      return this.items.find(i => i.id === this.selectedItem) || {};
    }
  },
  
  methods: {
    loadBackpack() {
      try {
        const saved = uni.getStorageSync('pet_backpack');
        if (saved) {
          // 合并保存的数量到当前items
          const savedCounts = JSON.parse(saved);
          this.items.forEach(item => {
            if (savedCounts[item.id] !== undefined) {
              item.count = savedCounts[item.id];
            }
          });
          console.log('[Backpack] 加载成功:', savedCounts);
        }
      } catch (e) {
        console.error('[Backpack] 加载失败:', e);
      }
    },
    
    saveBackpack() {
      try {
        // 只保存数量
        const counts = {};
        this.items.forEach(item => {
          counts[item.id] = item.count;
        });
        uni.setStorageSync('pet_backpack', JSON.stringify(counts));
        console.log('[Backpack] 保存成功:', counts);
      } catch (e) {
        console.error('[Backpack] 保存失败:', e);
      }
    },
    
    selectItem(item) {
      if (this.selectedItem === item.id) {
        this.selectedItem = null;
      } else {
        this.selectedItem = item.id;
      }
    },
    
    useItem() {
      if (!this.selectedItem) return;
      const item = this.items.find(i => i.id === this.selectedItem);
      if (!item || item.count <= 0) return;
      
      item.count--;
      // watch会自动保存
      
      this.$emit('use-item', { 
        itemId: item.id, 
        effect: item.effect,
        itemName: item.name
      });
      
      uni.showToast({
        title: `使用了 ${item.name}`,
        icon: 'success'
      });
    }
  }
}
</script>

<style lang="scss" scoped>
$bg-dark: #0f1526;
$bg-card: #1a2744;
$accent-cyan: #00d9ff;
$accent-gold: #ffd700;
$accent-green: #2ed573;
$text-light: #e8e8e8;
$text-dim: #6b7280;

.backpack-panel {
  padding: 16px;
  height: 100%;
}

.backpack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: $text-light;
}

.coin-display {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba($accent-gold, 0.2), rgba($accent-gold, 0.1));
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba($accent-gold, 0.3);
}

.coin-icon {
  font-size: 18px;
  margin-right: 6px;
}

.coin-amount {
  font-size: 16px;
  font-weight: bold;
  color: $accent-gold;
  font-family: monospace;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.item-slot {
  background: rgba($bg-card, 0.8);
  border: 2px solid rgba($accent-cyan, 0.15);
  border-radius: 12px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
  
  &.has-item {
    border-color: rgba($accent-cyan, 0.3);
  }
  
  &.selected {
    border-color: $accent-cyan;
    background: rgba($accent-cyan, 0.1);
    transform: scale(1.02);
  }
}

.item-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.item-name {
  font-size: 11px;
  color: $text-light;
  margin-bottom: 4px;
}

.item-count {
  font-size: 12px;
  font-weight: bold;
  color: $accent-cyan;
  font-family: monospace;
  
  &.empty {
    color: $text-dim;
  }
}

.item-detail {
  background: rgba($bg-card, 0.9);
  border: 1px solid rgba($accent-cyan, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-icon {
  font-size: 36px;
}

.detail-text {
  display: flex;
  flex-direction: column;
}

.detail-name {
  font-size: 14px;
  font-weight: bold;
  color: $text-light;
  margin-bottom: 4px;
}

.detail-desc {
  font-size: 11px;
  color: $text-dim;
}

.use-btn {
  background: linear-gradient(135deg, $accent-green, #00ff88);
  color: #000;
  font-weight: bold;
  font-size: 14px;
  padding: 10px 24px;
  border-radius: 20px;
  border: none;
  
  &:disabled {
    background: #444;
    color: #888;
  }
}

.shop-preview {
  margin-top: auto;
}

.shop-banner {
  background: linear-gradient(135deg, rgba($bg-card, 0.8), rgba($accent-cyan, 0.1));
  border: 1px dashed rgba($accent-cyan, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.shop-icon {
  font-size: 24px;
}

.shop-text {
  font-size: 14px;
  color: $text-light;
}

.coming-soon {
  font-size: 11px;
  color: $text-dim;
  background: rgba(#fff, 0.1);
  padding: 4px 10px;
  border-radius: 10px;
}
</style>
