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
$accent-red: #ff4757;
$accent-green: #2ed573;
$accent-yellow: #ffa502;
$accent-blue: #3742fa;
$text-dim: #747d8c;

/* 状态标签 */
.mini-status-row { 
  font-size: 10px; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin-bottom: 15px; 
  color: $text-dim; 
}

.perm-tag { 
  padding: 2px 6px; 
  border-radius: 4px; 
  background: #333; 
}

.perm-tag.ok { 
  color: $accent-green; 
  border: 1px solid $accent-green; 
}

.perm-tag.ng { 
  color: $accent-red; 
  border: 1px solid $accent-red; 
}

/* 按钮样式 */
.game-btn {
  border: none;
  border-radius: 8px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
}

.game-btn:active { 
  transform: translateY(4px); 
  box-shadow: none; 
}

.big-btn { 
  height: 50px; 
  line-height: 50px; 
  font-size: 16px; 
  margin-bottom: 15px; 
}

.mid-btn { 
  height: 40px; 
  line-height: 40px; 
  font-size: 14px; 
  margin-bottom: 15px; 
}

.btn-green { background: $accent-green; }
.btn-red { background: $accent-red; }
.btn-blue { background: $accent-blue; }
.btn-yellow { background: $accent-yellow; color: #000; }

/* 日志卡片 */
.log-card {
  background: #0f1526;
  border-radius: 8px;
  padding: 12px;
  margin-top: 10px;
  border: 1px solid #2f3542;
}

.log-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 1px dashed #2f3542;
  padding-bottom: 5px;
}

.panel-title { 
  font-size: 13px; 
  color: #a4b0be; 
  font-weight: bold; 
  margin: 0; 
}

.more-btn { 
  font-size: 11px; 
  color: #3742fa; 
  padding: 2px 5px; 
}

.growth-preview { 
  min-height: 60px; 
}

.log-item { 
  display: flex; 
  font-size: 11px; 
  margin-bottom: 6px; 
  align-items: center; 
}

.log-time { 
  color: #57606f; 
  margin-right: 8px; 
  font-family: monospace; 
}

.log-content { 
  flex: 1; 
  color: #dfe4ea; 
  overflow: hidden; 
  white-space: nowrap; 
  text-overflow: ellipsis; 
}

.log-val { 
  font-weight: bold; 
  margin-left: 5px; 
  min-width: 25px; 
  text-align: right; 
}

.t-green { color: #2ed573; }
.t-red { color: #ff4757; }
.empty-log { 
  color: #57606f; 
  text-align: center; 
  font-size: 10px; 
  padding: 10px; 
}

.btn-gold {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%) !important;
  color: #1a1a2e !important;
  font-weight: bold;
}
</style>
