<template>
  <view class="skin-market">
    <!-- 头部 -->
    <view class="market-header">
      <text class="market-title">🛒 皮肤商城</text>
      <view class="refresh-btn" @tap="refreshMarket">
        <text :class="{ 'spinning': isLoading }">🔄</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <scroll-view class="category-tabs" scroll-x>
      <view 
        v-for="cat in categories" 
        :key="cat.id"
        class="category-tab"
        :class="{ 'active': currentCategory === cat.id }"
        @tap="currentCategory = cat.id"
      >
        <text>{{ cat.icon }} {{ cat.name }}</text>
      </view>
    </scroll-view>

    <!-- 加载中 -->
    <view class="loading-state" v-if="isLoading">
      <text class="loading-icon">⏳</text>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else-if="filteredSkins.length === 0">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无皮肤</text>
      <text class="empty-hint">稍后再来看看吧~</text>
    </view>

    <!-- 皮肤列表 -->
    <scroll-view v-else class="skins-list" scroll-y>
      <view 
        v-for="skin in filteredSkins" 
        :key="skin.id"
        class="market-skin-card"
        @tap="selectSkin(skin)"
      >
        <!-- 预览区 -->
        <view class="skin-preview" :style="{ background: getPreviewBg(skin) }">
          <text class="skin-emoji">{{ skin.emoji || '👻' }}</text>
          
          <!-- 标签 -->
          <view class="skin-badges">
            <text v-if="skin.isNew" class="badge new">NEW</text>
            <text v-if="skin.isHot" class="badge hot">🔥</text>
            <text v-if="skin.isFree" class="badge free">免费</text>
          </view>
          
          <!-- 已拥有标记 -->
          <view v-if="isOwned(skin.id)" class="owned-badge">
            <text>✓ 已拥有</text>
          </view>
        </view>

        <!-- 信息区 -->
        <view class="skin-details">
          <text class="skin-name">{{ skin.name }}</text>
          <text class="skin-author">by {{ skin.author }}</text>
          
          <!-- 价格 -->
          <view class="skin-price">
            <text v-if="skin.isFree" class="price free">免费</text>
            <text v-else class="price coins">
              <text class="coin-icon">🪙</text>
              {{ skin.price }}
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 皮肤详情弹窗 -->
    <view class="detail-modal" v-if="selectedSkin" @tap.self="selectedSkin = null">
      <view class="detail-content" @tap.stop>
        <!-- 预览 -->
        <view class="detail-preview" :style="{ background: getPreviewBg(selectedSkin) }">
          <text class="detail-emoji">{{ selectedSkin.emoji || '👻' }}</text>
        </view>

        <!-- 信息 -->
        <view class="detail-info">
          <text class="detail-name">{{ selectedSkin.name }}</text>
          <text class="detail-author">作者: {{ selectedSkin.author }}</text>
          <text class="detail-desc">{{ selectedSkin.description }}</text>
        </view>

        <!-- 价格和操作 -->
        <view class="detail-actions">
          <view class="detail-price">
            <text v-if="selectedSkin.isFree">免费</text>
            <text v-else>
              <text class="coin-icon">🪙</text>
              {{ selectedSkin.price }}
            </text>
          </view>

          <button 
            v-if="isOwned(selectedSkin.id)"
            class="action-btn owned"
            disabled
          >
            已拥有
          </button>
          <button 
            v-else-if="selectedSkin.isFree || coins >= selectedSkin.price"
            class="action-btn buy"
            @tap="purchaseSkin(selectedSkin)"
          >
            {{ selectedSkin.isFree ? '获取' : '购买' }}
          </button>
          <button 
            v-else
            class="action-btn insufficient"
            disabled
          >
            金币不足
          </button>
        </view>

        <!-- 关闭按钮 -->
        <view class="close-btn" @tap="selectedSkin = null">
          <text>✕</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'SkinMarket',
  
  props: {
    coins: {
      type: Number,
      default: 0
    },
    ownedSkins: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      isLoading: false,
      currentCategory: 'all',
      selectedSkin: null,
      
      categories: [
        { id: 'all', name: '全部', icon: '🎨' },
        { id: 'ghost', name: '幽灵', icon: '👻' },
        { id: 'dog', name: '狗狗', icon: '🐕' },
        { id: 'bird', name: '鸟类', icon: '🦜' },
        { id: 'special', name: '限定', icon: '✨' }
      ],
      
      // 在线皮肤列表（模拟数据，实际从GitHub/uniCloud获取）
      marketSkins: [
        {
          id: 'neon_ghost',
          name: '霓虹幽灵',
          author: 'WordParasite',
          emoji: '👻',
          category: 'ghost',
          description: '璀璨的霓虹灯光中浮现的神秘幽灵',
          primaryColor: '#ff00ff',
          secondaryColor: '#00ffff',
          price: 100,
          isFree: false,
          isNew: true,
          isHot: false
        },
        {
          id: 'pixel_ghost',
          name: '像素幽灵',
          author: 'PixelArt',
          emoji: '👾',
          category: 'ghost',
          description: '复古像素风格的可爱幽灵',
          primaryColor: '#00ff00',
          secondaryColor: '#333333',
          price: 50,
          isFree: false,
          isNew: false,
          isHot: true
        },
        {
          id: 'golden_dog',
          name: '黄金犬',
          author: 'DogLover',
          emoji: '🐕',
          category: 'dog',
          description: '闪闪发光的黄金毛色狗狗',
          primaryColor: '#ffd700',
          secondaryColor: '#b8860b',
          price: 150,
          isFree: false,
          isNew: false,
          isHot: false
        },
        {
          id: 'rainbow_parrot',
          name: '彩虹鹦鹉',
          author: 'BirdWatcher',
          emoji: '🦜',
          category: 'bird',
          description: '七彩斑斓的热带鹦鹉',
          primaryColor: '#ff6b6b',
          secondaryColor: '#4ecdc4',
          price: 120,
          isFree: false,
          isNew: true,
          isHot: true
        },
        {
          id: 'starter_pack',
          name: '初心者礼包',
          author: 'WordParasite',
          emoji: '🎁',
          category: 'special',
          description: '新手专属的免费皮肤礼包',
          primaryColor: '#2ed573',
          secondaryColor: '#00d9ff',
          price: 0,
          isFree: true,
          isNew: false,
          isHot: false
        },
        {
          id: 'christmas_ghost',
          name: '圣诞幽灵',
          author: 'HolidayArt',
          emoji: '🎄',
          category: 'special',
          description: '带着圣诞帽的节日限定幽灵',
          primaryColor: '#c41e3a',
          secondaryColor: '#228b22',
          price: 200,
          isFree: false,
          isNew: true,
          isHot: false
        }
      ]
    };
  },

  computed: {
    filteredSkins() {
      if (this.currentCategory === 'all') {
        return this.marketSkins;
      }
      return this.marketSkins.filter(s => s.category === this.currentCategory);
    }
  },

  methods: {
    /**
     * 刷新市场
     */
    async refreshMarket() {
      this.isLoading = true;
      
      // 模拟网络请求
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: 实际从 GitHub/uniCloud 获取
      // const skins = await this.fetchOnlineSkins();
      
      this.isLoading = false;
      uni.showToast({ title: '已刷新', icon: 'success' });
    },

    /**
     * 获取预览背景
     */
    getPreviewBg(skin) {
      const primary = skin.primaryColor || '#00d9ff';
      const secondary = skin.secondaryColor || '#ff66cc';
      return `linear-gradient(135deg, ${primary}33, ${secondary}33)`;
    },

    /**
     * 检查是否已拥有
     */
    isOwned(skinId) {
      return this.ownedSkins.includes(skinId);
    },

    /**
     * 选择皮肤查看详情
     */
    selectSkin(skin) {
      this.selectedSkin = skin;
    },

    /**
     * 购买皮肤
     */
    purchaseSkin(skin) {
      if (this.isOwned(skin.id)) {
        uni.showToast({ title: '已拥有', icon: 'none' });
        return;
      }

      if (!skin.isFree && this.coins < skin.price) {
        uni.showToast({ title: '金币不足', icon: 'none' });
        return;
      }

      uni.showModal({
        title: skin.isFree ? '确认获取' : '确认购买',
        content: skin.isFree 
          ? `确定要获取「${skin.name}」吗？` 
          : `花费 ${skin.price} 金币购买「${skin.name}」？`,
        confirmColor: '#00d9ff',
        success: (res) => {
          if (res.confirm) {
            this.$emit('purchase', {
              skinId: skin.id,
              skinData: skin,
              price: skin.isFree ? 0 : skin.price
            });
            
            this.selectedSkin = null;
            uni.showToast({ title: '购买成功！', icon: 'success' });
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.skin-market {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0a0f1a;
}

/* 主容器 */
.skin-market {
  height: 100%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #2f3542;
}

.market-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.refresh-btn {
  font-size: 20px;
  padding: 5px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 分类标签 */
.category-tabs {
  white-space: nowrap;
  padding: 10px 15px;
  border-bottom: 1px solid #2f3542;
}

.category-tab {
  display: inline-block;
  padding: 8px 16px;
  margin-right: 10px;
  background: #1a1a2e;
  border-radius: 20px;
  font-size: 13px;
  color: #a4b0be;
  transition: all 0.3s;
}

.category-tab.active {
  background: linear-gradient(135deg, #00d9ff, #ff66cc);
  color: #fff;
}

/* 加载状态 */
.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.loading-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.loading-text,
.empty-text {
  font-size: 16px;
  color: #a4b0be;
}

.empty-hint {
  font-size: 12px;
  color: #747d8c;
  margin-top: 5px;
}

/* 皮肤列表 */
.skins-list {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  max-height: calc(70vh - 200px);
}

.market-skin-card {
  display: flex;
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid #2f3542;
  transition: all 0.3s;
}

.market-skin-card:active {
  transform: scale(0.98);
  border-color: #00d9ff;
}

/* 预览区 */
.skin-preview {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.skin-emoji {
  font-size: 45px;
}

.skin-badges {
  position: absolute;
  top: 5px;
  left: 5px;
  display: flex;
  gap: 3px;
}

.badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
}

.badge.new {
  background: #00d9ff;
  color: #000;
}

.badge.hot {
  background: #ff4757;
  color: #fff;
}

.badge.free {
  background: #2ed573;
  color: #fff;
}

.owned-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 217, 255, 0.9);
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 10px;
  color: #000;
  font-weight: bold;
}

/* 信息区 */
.skin-details {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.skin-name {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 3px;
}

.skin-author {
  font-size: 11px;
  color: #747d8c;
  margin-bottom: 8px;
}

.skin-price {
  display: flex;
  align-items: center;
}

.price {
  font-size: 14px;
  font-weight: bold;
}

.price.free {
  color: #2ed573;
}

.price.coins {
  color: #ffd700;
  display: flex;
  align-items: center;
  gap: 4px;
}

.coin-icon {
  font-size: 14px;
}

/* 详情弹窗 */
.detail-modal {
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

.detail-content {
  width: 85%;
  max-width: 350px;
  background: #1a1a2e;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.detail-preview {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-emoji {
  font-size: 70px;
}

.detail-info {
  padding: 20px;
  text-align: center;
}

.detail-name {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  display: block;
  margin-bottom: 5px;
}

.detail-author {
  font-size: 12px;
  color: #747d8c;
  display: block;
  margin-bottom: 10px;
}

.detail-desc {
  font-size: 13px;
  color: #a4b0be;
  line-height: 1.5;
  display: block;
}

.detail-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px 20px;
  border-top: 1px solid #2f3542;
}

.detail-price {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.action-btn {
  padding: 10px 30px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  border: none;
}

.action-btn.buy {
  background: linear-gradient(135deg, #00d9ff, #00b4d8);
  color: #000;
}

.action-btn.owned {
  background: #2f3542;
  color: #747d8c;
}

.action-btn.insufficient {
  background: #ff4757;
  color: #fff;
  opacity: 0.6;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
}
</style>
