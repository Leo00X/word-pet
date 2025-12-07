<template>
  <view class="panel-body">
    <view class="mini-status-row">
      <text class="mini-label">系统连接:</text>
      <text class="perm-tag" :class="hasFloatPermission ? 'ok' : 'ng'">
        {{ hasFloatPermission ? '悬浮窗正常' : '悬浮窗断开' }}
      </text>
      <text class="perm-tag" :class="hasUsagePermission ? 'ok' : 'ng'">
        {{ hasUsagePermission ? '监控正常' : '监控断开' }}
      </text>
    </view>

    <button 
      class="game-btn big-btn" 
      :class="isPetShown ? 'btn-red' : 'btn-green'"
      @click="$emit('toggle-pet')"
    >
      {{ isPetShown ? '收回寄生兽' : '召唤寄生兽' }}
    </button>

    <button 
      class="game-btn mid-btn" 
      :class="isMonitoring ? 'btn-yellow' : 'btn-blue'"
      @click="$emit('toggle-monitor')"
    >
      {{ isMonitoring ? '⏹ 停止全域监控' : '👁 开启全域监控' }}
    </button>

    <button 
      class="game-btn mid-btn btn-gold"
      @click="$emit('open-achievements')"
    >
      🏆 成就系统 ({{ achievementProgress }}%)
    </button>

    <view class="log-card">
      <view class="log-header-row">
        <text class="panel-title">📝 最近动态</text>
        <text class="more-btn" @click="$emit('open-history')">查看全部档案 ></text>
      </view>
      
      <view class="growth-preview">
        <view v-for="(item, index) in growthLogs" :key="index" class="log-item">
          <text class="log-time">[{{ item.time }}]</text>
          <rich-text class="log-content" :nodes="formatLogMsg(item.msg)"></rich-text>
          <text v-if="item.val !== 0" class="log-val" :class="item.val > 0 ? 't-green' : 't-red'">
            {{ item.val > 0 ? '+' : '' }}{{ item.val }}
          </text>
        </view>
        <view v-if="growthLogs.length === 0" class="empty-log">暂无今日记录...</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'StatusPanel',
  props: {
    hasFloatPermission: {
      type: Boolean,
      default: false
    },
    hasUsagePermission: {
      type: Boolean,
      default: false
    },
    isPetShown: {
      type: Boolean,
      default: false
    },
    isMonitoring: {
      type: Boolean,
      default: false
    },
    growthLogs: {
      type: Array,
      default: () => []
    },
    achievementProgress: {
      type: Number,
      default: 0
    }
  },
  methods: {
    // 格式化日志消息,让数字显示不同颜色
    formatLogMsg(msg) {
      // 将 +数字 显示为绿色, -数字 显示为红色
      let formatted = msg;
      // 匹配 +数字
      formatted = formatted.replace(/(\+\d+)/g, '<span style="color:#2ed573;font-weight:bold;">$1</span>');
      // 匹配 -数字
      formatted = formatted.replace(/(\-\d+)/g, '<span style="color:#ff4757;font-weight:bold;">$1</span>');
      return formatted;
    }
  }
}
</script>

<style lang="scss" scoped>
/* 状态标签 */
.mini-status-row { 
  font-size: 10px; 
  display: flex; 
  align-items: center; 
  gap: $space-sm; 
  margin-bottom: $space-md; 
  color: $text-dim; 
}

.perm-tag { 
  padding: 3px 8px; 
  border-radius: $radius-xs;
  background: rgba($bg-elevated, 0.8);
  font-weight: 500;
  transition: all $transition-fast;
}

.perm-tag.ok { 
  color: $cyber-success; 
  border: 1px solid rgba($cyber-success, 0.5);
  box-shadow: 0 0 8px rgba($cyber-success, 0.2);
}

.perm-tag.ng { 
  color: $cyber-danger; 
  border: 1px solid rgba($cyber-danger, 0.5);
  box-shadow: 0 0 8px rgba($cyber-danger, 0.2);
}

/* 按钮基类 */
.game-btn {
  border: none;
  border-radius: $radius-md;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.3);
  transition: all $transition-fast $ease-smooth;
  position: relative;
  overflow: hidden;
  
  &:active { 
    transform: translateY(4px); 
    box-shadow: none; 
  }
}

.big-btn { 
  height: 52px; 
  line-height: 52px; 
  font-size: 16px; 
  margin-bottom: $space-md;
  letter-spacing: 1px;
}

.mid-btn { 
  height: 42px; 
  line-height: 42px; 
  font-size: 14px; 
  margin-bottom: $space-md; 
}

/* 渐变按钮 */
.btn-green { 
  background: $gradient-success;
  box-shadow: 0 4px 0 darken($cyber-success, 20%), $shadow-glow-green;
}

.btn-red { 
  background: $gradient-danger;
  box-shadow: 0 4px 0 darken($cyber-danger, 20%), $shadow-glow-red;
}

.btn-blue { 
  background: $gradient-cyber;
  box-shadow: 0 4px 0 darken($cyber-primary, 30%), $shadow-glow-cyan;
}

.btn-yellow { 
  background: $gradient-warning;
  color: $bg-deepest;
  box-shadow: 0 4px 0 darken($cyber-warning, 25%);
}

.btn-gold {
  background: $gradient-gold !important;
  color: $bg-deepest !important;
  font-weight: bold;
  box-shadow: 0 4px 0 darken(#ffd700, 30%), 0 0 15px rgba(#ffd700, 0.3);
}

/* 日志卡片 */
.log-card {
  background: linear-gradient(180deg, rgba($bg-dark, 0.9), rgba($bg-deepest, 0.95));
  border-radius: $radius-md;
  padding: $space-md;
  margin-top: 12px;
  border: 1px solid rgba($cyber-primary, 0.15);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.log-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px dashed rgba($cyber-primary, 0.2);
  padding-bottom: 8px;
}

.panel-title { 
  font-size: 13px; 
  background: $gradient-cyber;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold; 
  margin: 0; 
}

.more-btn { 
  font-size: 11px; 
  color: $cyber-primary; 
  padding: 4px 8px;
  border-radius: $radius-xs;
  transition: all $transition-fast;
  
  &:active {
    background: rgba($cyber-primary, 0.1);
  }
}

.growth-preview { 
  min-height: 60px; 
}

.log-item { 
  display: flex; 
  font-size: 11px; 
  margin-bottom: 8px; 
  align-items: center;
  padding: 6px 8px;
  border-radius: $radius-xs;
  background: rgba($bg-card, 0.5);
  transition: background $transition-fast;
}

.log-time { 
  color: $text-muted; 
  margin-right: 10px; 
  font-family: monospace;
  font-size: 10px;
}

.log-content { 
  flex: 1; 
  color: $text-normal; 
  overflow: hidden; 
  white-space: nowrap; 
  text-overflow: ellipsis; 
}

.log-val { 
  font-weight: bold; 
  margin-left: 8px; 
  min-width: 30px; 
  text-align: right;
  font-family: monospace;
}

.t-green { color: $cyber-success; }
.t-red { color: $cyber-danger; }

.empty-log { 
  color: $text-muted; 
  text-align: center; 
  font-size: 11px; 
  padding: $space-md;
  font-style: italic;
}
</style>
