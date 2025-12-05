// pages/test-clear-storage.vue
// 临时测试页面：清除损坏的 Storage 并重新初始化
<template>
  <view class="container">
    <view class="title">Storage 修复工具</view>
    
    <button class="btn clear-btn" @click="clearStorage">清除所有 AI 配置</button>
    <button class="btn init-btn" @click="initStorage">重新初始化配置</button>
    <button class="btn test-btn" @click="testRead">测试读取配置</button>
    
    <view class="log">
      <text v-for="(log, index) in logs" :key="index" class="log-item">{{ log }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { setSecureStorage, getSecureStorage, removeSecureStorage } from '@/utils/encryptStorage.js';

const logs = ref([]);

function addLog(msg) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

// 清除所有数据
function clearStorage() {
  try {
    // 清除 AI 配置
    uni.removeStorageSync('ai_config');
    // 也清除设备 UUID（会导致加密密钥重新生成）
    uni.removeStorageSync('device_uuid');
    
    addLog('✅ 已清除所有 Storage 数据');
    uni.showToast({ title: '清除成功', icon: 'success' });
  } catch (e) {
    addLog(`❌ 清除失败: ${e.message}`);
  }
}

// 重新初始化
function initStorage() {
  try {
    const defaultConfig = {
      currentModelId: 'gemini-default',
      presetModels: [
        {
          id: 'deepseek-default',
          name: 'DeepSeek V3.2',
          type: 'deepseek',
          icon: '🧠',
          description: '高性能对话模型',
          apiKey: 'sk-450792972278576f8ed953548a6365cbf26d56e5487c66c46116b326f72b98e5',
          baseUrl: 'https://api.qnaigc.com/v1/chat/completions',
          modelId: 'deepseek/deepseek-v3.2-251201',
          isPreset: true
        },
        {
          id: 'gemini-default',
          name: 'Gemini 2.5 Flash-Lite',
          type: 'gemini',
          icon: '✨',
          description: '支持思维链推理',
          apiKey: 'AIzaSyBSk3gZvA8JLUyU1qgnZ8j2WtPFc7wNUjs',
          modelId: 'gemini-2.5-flash',
          isPreset: true
        }
      ],
      customModels: []
    };
    
    setSecureStorage('ai_config', defaultConfig);
    addLog('✅ 配置初始化成功！');
    addLog(`当前模型: ${defaultConfig.currentModelId}`);
    uni.showToast({ title: '初始化成功', icon: 'success' });
  } catch (e) {
    addLog(`❌ 初始化失败: ${e.message}`);
  }
}

// 测试读取
function testRead() {
  try {
    const config = getSecureStorage('ai_config');
    if (config) {
      addLog(`✅ 读取成功！当前模型: ${config.currentModelId}`);
      addLog(`预置模型数: ${config.presetModels?.length || 0}`);
    } else {
      addLog('⚠️ 配置为空');
    }
  } catch (e) {
    addLog(`❌ 读取失败: ${e.message}`);
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 40rpx;
  background: #1e272e;
  min-height: 100vh;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #ffa502;
  margin-bottom: 40rpx;
  text-align: center;
}

.btn {
  width: 100%;
  margin-bottom: 20rpx;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.clear-btn {
  background: #ee5a6f;
}

.init-btn {
  background: #2ed573;
}

.test-btn {
  background: #5f27cd;
}

.log {
  margin-top: 40rpx;
  background: #2f3542;
  padding: 20rpx;
  border-radius: 12rpx;
  max-height: 600rpx;
  overflow-y: auto;
}

.log-item {
  display: block;
  font-size: 12px;
  color: #dfe4ea;
  margin-bottom: 8rpx;
  font-family: monospace;
}
</style>
