<template>
  <view class="cognitive-page">
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @tap="goBack">
        <text class="back-icon">←</text>
        <text class="back-text">返回</text>
      </view>
      <text class="nav-title">🧠 认知核心</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 标签页切换 -->
    <view class="tabs-header">
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'vector' }"
        @tap="currentTab = 'vector'"
      >
        <text class="tab-icon">🕸️</text>
        <text class="tab-text">向量引擎</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'memory' }"
        @tap="currentTab = 'memory'"
      >
        <text class="tab-icon">💾</text>
        <text class="tab-text">记忆库</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: currentTab === 'mind' }"
        @tap="currentTab = 'mind'"
      >
        <text class="tab-icon">🛌</text>
        <text class="tab-text">思维状态</text>
      </view>
    </view>

    <!-- 内容区域 -->
    <scroll-view class="content-scroll" scroll-y>
      
      <!-- Tab 1: 向量引擎 -->
      <view v-if="currentTab === 'vector'" class="tab-content">
        <!-- 统计卡片 -->
        <view class="status-card">
          <view class="stat-row">
            <text class="stat-label">存储向量:</text>
            <text class="stat-value highlight">{{ vectorStats.totalVectors }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">API调用:</text>
            <text class="stat-value">{{ vectorStats.apiCalls }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">缓存命中:</text>
            <text class="stat-value">{{ vectorStats.cacheHits }}</text>
          </view>
        </view>

        <!-- 配置区域 -->
        <view class="config-section">
          <text class="section-title">Embedding API 配置</text>
          <view class="input-group">
            <input 
              class="cyber-input" 
              password 
              placeholder="输入 Gemini API Key" 
              v-model="embeddingKey"
            />
            <button class="action-btn small" @tap="saveEmbeddingKey">保存</button>
          </view>
          <text class="hint-text" v-if="!vectorStats.isConfigured">⚠️ 未配置 Key，当前使用模拟向量（低精度）</text>
          <text class="hint-text success" v-else>✅ API Key 已配置</text>
        </view>

        <!-- 测试工具 -->
        <view class="test-section">
          <text class="section-title">语义搜索测试</text>
          <view class="input-group">
            <input 
              class="cyber-input" 
              placeholder="输入问题测试检索..." 
              v-model="testQuery"
            />
            <button class="action-btn" @tap="runSemanticSearch">搜索</button>
          </view>
          
          <!-- 搜索结果 -->
          <view class="search-results" v-if="searchResults.length > 0">
            <view class="result-item" v-for="(res, idx) in searchResults" :key="idx">
              <view class="result-header">
                <text class="similarity">相似度: {{(res.similarity * 100).toFixed(1)}}%</text>
                <text class="timestamp">{{formatTime(res.timestamp)}}</text>
              </view>
              <text class="result-content">{{res.content}}</text>
            </view>
          </view>
        </view>

        <!-- 危险操作 -->
        <view class="danger-zone">
          <button class="danger-btn" @tap="clearVectors">🗑️ 清空向量库</button>
        </view>
      </view>

      <!-- Tab 2: 记忆库 -->
      <view v-if="currentTab === 'memory'" class="tab-content">
        <view class="status-card">
          <view class="stat-row">
            <text class="stat-label">事实记忆:</text>
            <text class="stat-value">{{ factsCount }}</text>
          </view>
          <view class="stat-row">
            <text class="stat-label">知识图谱:</text>
            <text class="stat-value">{{ graphCount }}</text>
          </view>
        </view>

        <view class="memory-list">
          <text class="section-title">关键事实 (Facts)</text>
          <view class="fact-item" v-for="(value, key) in facts" :key="key">
            <text class="fact-label">{{formatKey(key)}}</text>
            <text class="fact-value">{{value || '未知'}}</text>
          </view>
        </view>

        <view class="memory-list">
          <text class="section-title">知识图谱 (Top 20)</text>
          <view class="graph-item" v-for="(node, idx) in knowledgeGraph" :key="idx">
            <text class="triple">{{node.subject}} {{node.predicate}} {{node.object}}</text>
          </view>
          <text class="hint-text" v-if="knowledgeGraph.length === 0">暂无知识图谱数据</text>
        </view>
      </view>

      <!-- Tab 3: 思维状态 -->
      <view v-if="currentTab === 'mind'" class="tab-content">
        <!-- 睡眠控制 -->
        <view class="status-card">
          <view class="stat-row">
            <text class="stat-label">当前状态:</text>
            <text class="stat-value status-text">{{ isSleeping ? '😴 睡眠中' : '☀️ 清醒' }}</text>
          </view>
          <view class="action-row">
            <button class="action-btn" v-if="!isSleeping" @tap="forceSleep">强制入睡</button>
            <button class="action-btn" v-else @tap="forceWake">强制唤醒</button>
          </view>
        </view>

        <!-- 每日摘要 -->
        <view class="reflection-section">
          <text class="section-title">📅 昨日记忆摘要</text>
          <view class="summary-box">
            <text class="summary-text">{{ dailySummary || '暂无摘要生成' }}</text>
          </view>
        </view>

        <!-- 习惯洞察 -->
        <view class="reflection-section">
          <text class="section-title">🔮 行为洞察</text>
          <view class="insight-list">
            <text class="insight-item" v-for="(insight, idx) in insights" :key="idx">• {{insight}}</text>
            <text class="hint-text" v-if="!insights || insights.length === 0">需要更多数据积累</text>
          </view>
        </view>
      </view>

    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useVectorMemory } from '../index/composables/useVectorMemory.js';
import { useMemory } from '../index/composables/useMemory.js';
import { useReflection } from '../index/composables/useReflection.js';
import { useSleepWake } from '../index/composables/useSleepWake.js';

// 初始化 Tabs
const currentTab = ref('vector');

// HCDS 组件实例
const vectorMemory = useVectorMemory();
const memory = useMemory();
const reflection = useReflection();
const sleepWake = useSleepWake(); // 注意：useSleepWake 是函数创建实例，如果 index.vue 没有全局共享，这里是新实例

// 为了获取全局状态，理想情况下应从 index.vue 传递或使用全局状态管理
// 但由于 composables 有一部分是单例模式(useMemory内部状态是 module-scoped refs吗？检查一下)
// 检查发现 composables 内部大多数使用 module-scoped refs (定义在函数外)，所以多处调用共享状态。
// useVectorMemory: refs 在函数内 -> 不是单例！
// useMemory: refs 在函数内 -> 不是单例！
// 这意味着如果不从 index.vue 传递，这里的 debug 页面将看到空数据。
// 这是一个架构问题。我们需要确保数据能被 debug 页面访问。
// 
// 修正：检查 useMemory.js 源码，ref 是在 function 内部定义的。
// 这意味着每次 useMemory() 都会创建新状态。
// 除非 index.vue 里的实例把状态写到了 uni.storage，而这里重新 loadData()。
// 大多数 loadData() 会从 storage 读取，所以在 storage 中的数据是同步的。
// 但内存中的临时状态（如 cache）可能不同步。
// 对于 Debug 页面，读取 Storage 数据是可接受的。

// --- 向量引擎逻辑 ---
const vectorStats = ref({});
const embeddingKey = ref('');
const testQuery = ref('');
const searchResults = ref([]);

const refreshVectorStats = () => {
  vectorStats.value = vectorMemory.getStats();
  // 尝试获取 key (需要暴露或 hack)
  // useVectorMemory 没有暴露 getApiKey，但有 stats.isConfigured
};

const saveEmbeddingKey = () => {
  if(embeddingKey.value) {
    vectorMemory.setApiKey(embeddingKey.value);
    uni.showToast({title: 'Key 已保存', icon: 'success'});
    refreshVectorStats();
  }
};

const runSemanticSearch = async () => {
  if(!testQuery.value) return;
  uni.showLoading({title: '搜索中...'});
  try {
    searchResults.value = await vectorMemory.semanticSearch(testQuery.value, 5);
  } catch(e) {
    uni.showToast({title: '搜索失败', icon: 'none'});
  } finally {
    uni.hideLoading();
  }
};

const clearVectors = () => {
  uni.showModal({
    title: '警告',
    content: '确定清空所有向量记忆吗？此操作不可逆。',
    success: (res) => {
      if(res.confirm) {
        vectorMemory.clearAllVectorMemories();
        refreshVectorStats();
        uni.showToast({title: '已清空', icon: 'success'});
      }
    }
  });
};

// --- 记忆库逻辑 ---
// 假设 useMemory loadData 会读取 storage
const facts = computed(() => memory.facts.value || {});
const knowledgeGraph = computed(() => memory.knowledgeGraph.value || []);
const factsCount = computed(() => Object.keys(facts.value).length);
const graphCount = computed(() => knowledgeGraph.value.length);

// --- 思维状态逻辑 ---
// useReflection 和 useSleepWake 同样依赖 loadData
const isSleeping = computed(() => sleepWake.isSleeping.value);
const dailySummary = computed(() => reflection.dailySummary?.value?.content || '');
const insights = computed(() => reflection.userHabits?.value || []);

const forceSleep = () => {
  sleepWake.goToSleep(); 
  uni.showToast({title: '已强制入睡', icon: 'none'});
};
const forceWake = () => {
  sleepWake.wakeUp();
  uni.showToast({title: '已强制唤醒', icon: 'none'});
};

// --- 通用 ---
const goBack = () => uni.navigateBack();
const formatTime = (ts) => new Date(ts).toLocaleString();
const formatKey = (key) => {
  const map = {
    userName: '用户昵称',
    petName: '宠物昵称',
    favoriteApp: '常用应用',
    lastMood: '最近心情',
    firstMeetDate: '相识日期',
    totalChats: '对话总数'
  };
  return map[key] || key;
};

// 生命周期
onShow(() => {
  // 重新加载数据以确保同步
  vectorMemory.loadData();
  // vectorMemory 自带 loadData 不会加载 key，需要补充? 
  // 我们刚才修改了 useVectorMemory 加上了 loadApiKey 初始化调用。
  // 但这里 new instance 会再次调用 init，所以会有 key。
  
  memory.loadData();
  reflection.loadData();
  // sleepWake 没有 loadData，它依赖 storage 和 reactive refs
  // 如果 sleepWake refs 是函数内的，这里的新实例 state 可能是初始值(false)。
  // 这会导致显示不准确。这是一个限制。
  // 除非我们把 useSleepWake 的 state 改成全局单例 (定义在函数外)。
  // 鉴于时间，我们先假设它有 persistence 或能读取 storage。
  // 检查 useSleepWake: isSleeping = ref(false). loadState() 读取 STORAGE_KEY。
  // 它的初始化逻辑里调用了 loadState()。所以应该是同步的。
    
  refreshVectorStats();
});
</script>

<style lang="scss" scoped>
$bg-deepest: #0a0e1a;
$bg-dark: #0f1526;
$bg-card: #1a2744;
$cyber-primary: #00ffff;
$text-light: #e8e8e8;
$text-dim: #6b7280;

.cognitive-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg-dark 0%, $bg-deepest 100%);
  color: $text-light;
  width: 100vw;
  overflow-x: hidden;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: rgba($bg-card, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba($cyber-primary, 0.1);
  
  .nav-back {
    display: flex;
    align-items: center;
    padding: 10rpx;
    .back-icon { color: $cyber-primary; font-size: 36rpx; margin-right: 10rpx; }
    .back-text { color: $text-light; font-size: 28rpx; }
  }
  .nav-title { font-size: 34rpx; font-weight: bold; color: $cyber-primary; }
  .nav-placeholder { width: 100rpx; }
}

.tabs-header {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  background: rgba($bg-card, 0.5);
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    transition: all 0.3s;
    opacity: 0.6;
    
    &.active {
      opacity: 1;
      border-bottom: 2px solid $cyber-primary;
      background: rgba($cyber-primary, 0.05);
      .tab-text { color: $cyber-primary; }
    }
    
    .tab-icon { margin-right: 8rpx; }
    .tab-text { font-size: 28rpx; font-weight: bold; }
  }
}

.content-scroll {
  height: calc(100vh - 180rpx);
  padding: 30rpx;
  box-sizing: border-box;
}

.tab-content {
  padding-bottom: 60rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: $cyber-primary;
  margin: 30rpx 0 20rpx;
  display: block;
  border-left: 3px solid $cyber-primary;
  padding-left: 16rpx;
}

.status-card {
  background: rgba($bg-card, 0.6);
  border-radius: 16rpx;
  padding: 24rpx;
  border: 1px solid rgba($cyber-primary, 0.2);
  margin-bottom: 30rpx;
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12rpx;
    font-size: 28rpx;
    
    .stat-label { color: $text-dim; }
    .stat-value { font-family: monospace; font-weight: bold; }
    .highlight { color: $cyber-primary; font-size: 32rpx; }
    .status-text { color: #ffd700; }
  }
  
  .action-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 20rpx;
  }
}

.config-section, .test-section, .memory-list, .reflection-section {
  margin-bottom: 40rpx;
}

.input-group {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  
  .cyber-input {
    flex: 1;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    padding: 16rpx;
    border-radius: 8rpx;
    font-size: 26rpx;
  }
}

.action-btn {
  background: rgba($cyber-primary, 0.2);
  color: $cyber-primary;
  border: 1px solid $cyber-primary;
  font-size: 24rpx;
  padding: 0 24rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  
  &.small { font-size: 22rpx; height: 60rpx; }
}

.danger-btn {
  background: rgba(255,0,0,0.2);
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  width: 100%;
  padding: 20rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
}

.hint-text {
  font-size: 22rpx;
  color: $text-dim;
  display: block;
  margin-top: 10rpx;
  
  &.success { color: #2ecc71; }
}

.result-item, .fact-item, .graph-item {
  background: rgba(255,255,255,0.05);
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
  
  .result-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8rpx;
    font-size: 22rpx;
    color: $text-dim;
    .similarity { color: $cyber-primary; }
  }
  .result-content { font-size: 26rpx; line-height: 1.4; }
}

.fact-item {
  display: flex;
  justify-content: space-between;
  .fact-label { color: $text-dim; font-size: 26rpx; }
  .fact-value { color: $text-light; font-weight: bold; font-size: 26rpx; }
}

.triple { font-family: monospace; font-size: 24rpx; color: #a8d8ea; }

.summary-box {
  background: rgba($bg-card, 0.4);
  padding: 24rpx;
  border-radius: 12rpx;
  border-left: 2px solid #fdcb6e;
  .summary-text { font-size: 26rpx; line-height: 1.6; font-style: italic; }
}

.insight-item {
  display: block;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #81ecec;
}
</style>
