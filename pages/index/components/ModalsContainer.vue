<template>
  <view class="modals-container">
    <!-- 成就弹窗 -->
    <ModalWrapper 
      :visible="modals.achievement" 
      title="🏆 成就殿堂"
      @close="closeModal('achievement')"
    >
      <AchievementPanel />
    </ModalWrapper>

    <!-- 皮肤选择弹窗 -->
    <ModalWrapper 
      :visible="modals.skin" 
      title="🎨 皮肤管理"
      contentClass="skin-modal"
      @close="closeModal('skin')"
    >
      <SkinSelector 
        :currentSkin="skins.currentSkin.value"
        :allSkinsWithStatus="skins.allSkinsWithStatus.value"
        :onlineSkins="skins.onlineSkins.value"
        :downloadProgress="skins.downloadProgress.value"
        :isLoading="skins.isLoading.value"
        :showOnlineSection="false"
        @select="handlers.handleSkinSelect"
        @refresh-online="skins.fetchOnlineSkins"
        @download="skins.downloadSkin"
      />
    </ModalWrapper>

    <!-- 皮肤商城弹窗 -->
    <ModalWrapper 
      :visible="modals.market" 
      title="🛒 皮肤商城"
      contentClass="market-modal"
      @close="closeModal('market')"
    >
      <SkinMarket 
        :coins="growth.coins.value"
        :ownedSkins="ownedSkinIds"
        @purchase="handlers.handleSkinPurchase"
      />
    </ModalWrapper>

    <!-- 数据备份弹窗 -->
    <ModalWrapper 
      :visible="modals.backup" 
      title="☁️ 数据备份"
      contentClass="backup-modal"
      @close="closeModal('backup')"
    >
      <BackupPanel :cloudSync="cloudSync" />
    </ModalWrapper>

    <!-- 猜单词小游戏（独立样式） -->
    <WordGuessGame 
      :visible="modals.game"
      @close="closeModal('game')"
      @game-end="handlers.handleGameEnd"
    />
  </view>
</template>

<script>
import ModalWrapper from './ModalWrapper.vue';
import AchievementPanel from './AchievementPanel.vue';
import SkinSelector from './SkinSelector.vue';
import SkinMarket from './SkinMarket.vue';
import BackupPanel from './BackupPanel.vue';
import WordGuessGame from './WordGuessGame.vue';

export default {
  name: 'ModalsContainer',
  
  components: {
    ModalWrapper,
    AchievementPanel,
    SkinSelector,
    SkinMarket,
    BackupPanel,
    WordGuessGame
  },
  
  props: {
    // 弹窗状态
    modals: {
      type: Object,
      required: true
    },
    // 关闭弹窗方法
    closeModal: {
      type: Function,
      required: true
    },
    // 事件处理器
    handlers: {
      type: Object,
      required: true
    },
    // 数据依赖
    skins: {
      type: Object,
      required: true
    },
    growth: {
      type: Object,
      required: true
    },
    cloudSync: {
      type: Object,
      default: null
    }
  },

  computed: {
    ownedSkinIds() {
      if (this.skins && this.skins.localSkins && this.skins.localSkins.value) {
        return this.skins.localSkins.value.map(s => s.id);
      }
      return [];
    }
  }
};
</script>

<style lang="scss" scoped>
.modals-container {
  // 容器无样式，仅用于组织弹窗
}
</style>
