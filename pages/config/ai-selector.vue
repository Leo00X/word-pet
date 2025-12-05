<template>
  <view class="ai-selector">
    <!-- 顶部导航栏 -->
    <view class="navbar">
      <view class="nav-back" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">AI 模型选择</text>
      <view class="nav-placeholder"></view>
    </view>

    <!-- 当前激活模型显示 -->
    <view class="current-model" v-if="currentModel">
      <text class="current-label">当前使用</text>
      <view class="current-info">
        <text class="current-icon">{{ currentModel.icon }}</text>
        <view class="current-text">
          <text class="current-name">{{ currentModel.name }}</text>
          <text class="current-desc">{{ currentModel.description }}</text>
        </view>
      </view>
    </view>

    <!-- 预置模型卡片 -->
    <view class="section">
      <text class="section-title">📦 预置模型</text>
      
      <view 
        v-for="model in presetModels" 
        :key="model.id"
        class="model-card"
        :class="{ active: model.id === currentModelId }"
        @click="selectModel(model.id)"
      >
        <view class="model-header">
          <text class="model-icon">{{ model.icon }}</text>
          <view class="model-info">
            <text class="model-name">{{ model.name }}</text>
            <text class="model-desc">{{ model.description }}</text>
          </view>
          <view class="model-status">
            <text v-if="model.id === currentModelId" class="status-badge active-badge">使用中</text>
            <text v-else-if="model.apiKey" class="status-badge ready-badge">✓ 已配置</text>
            <text v-else class="status-badge warning-badge">⚠ 需配置</text>
          </view>
        </view>
        
        <view class="model-actions">
          <button 
            class="action-btn config-btn" 
            size="mini"
            @click.stop="editKey(model)"
          >
            {{ model.apiKey ? '修改密钥' : '配置密钥' }}
          </button>
        </view>
      </view>
    </view>

    <!-- 自定义模型列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">🔧 自定义模型</text>
        <button class="add-btn" size="mini" @click="showAddForm = true">+ 添加</button>
      </view>
      
      <view v-if="customModels.length === 0" class="empty-tip">
        <text>暂无自定义模型，点击右上角添加</text>
      </view>
      
      <view 
        v-for="model in customModels" 
        :key="model.id"
        class="model-card"
        :class="{ active: model.id === currentModelId }"
      >
        <view class="model-header">
          <text class="model-icon">{{ model.icon }}</text>
          <view class="model-info">
            <text class="model-name">{{ model.name }}</text>
            <text class="model-desc">{{ model.baseUrl }}</text>
          </view>
          <view class="model-status">
            <text v-if="model.id === currentModelId" class="status-badge active-badge">使用中</text>
          </view>
        </view>
        
        <view class="model-actions">
          <button class="action-btn use-btn" size="mini" @click="selectModel(model.id)">切换</button>
          <button class="action-btn delete-btn" size="mini" @click="deleteModel(model.id)">删除</button>
        </view>
      </view>
    </view>

    <!-- API Key 配置弹窗 -->
    <view v-if="showKeyModal" class="modal-mask" @click="showKeyModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">配置 {{ editingModel?.name }}</text>
          <text class="modal-close" @click="showKeyModal = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">API Key</text>
            <input 
              class="form-input" 
              v-model="editingApiKey" 
              type="text"
              placeholder="请输入 API Key"
              :password="!showPassword"
            />
            <text class="eye-icon" @click="showPassword = !showPassword">
              {{ showPassword ? '👁' : '🙈' }}
            </text>
          </view>
          
          <view class="form-tip">
            <text v-if="editingModel?.type === 'gemini'">
              💡 获取地址: https://aistudio.google.com/apikey
            </text>
            <text v-else-if="editingModel?.type === 'deepseek'">
              💡 使用 DeepSeek 代理服务
            </text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn test-btn" @click="testConnection">测试连接</button>
          <button class="modal-btn save-btn" @click="saveApiKey">保存</button>
        </view>
      </view>
    </view>

    <!-- 添加自定义模型弹窗 -->
    <view v-if="showAddForm" class="modal-mask" @click="showAddForm = false">
      <view class="modal-content large-modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加自定义模型</text>
          <text class="modal-close" @click="showAddForm = false">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text class="form-label">模型名称</text>
            <input class="form-input" v-model="formData.name" placeholder="例如: ChatGPT 4" />
          </view>
          <view class="form-item">
            <text class="form-label">API 地址</text>
            <input class="form-input" v-model="formData.baseUrl" placeholder="https://.../chat/completions" />
          </view>
          <view class="form-item">
            <text class="form-label">API Key</text>
            <input class="form-input" v-model="formData.apiKey" type="text" placeholder="sk-xxx..." />
          </view>
          <view class="form-item">
            <text class="form-label">Model ID</text>
            <input class="form-input" v-model="formData.modelId" placeholder="gpt-4" />
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel-btn" @click="showAddForm = false">取消</button>
          <button class="modal-btn save-btn" @click="saveCustomModel">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useAIConfig } from '../index/composables/useAIConfig.js';

// 使用配置管理
const {
  currentModel,
  currentModelId,
  presetModels,
  customModels,
  switchModel,
  updateModelKey,
  addCustomModel,
  deleteCustomModel,
  testModelConnection
} = useAIConfig();

// 编辑 API Key 相关状态
const showKeyModal = ref(false);
const editingModel = ref(null);
const editingApiKey = ref('');
const showPassword = ref(false);

// 添加自定义模型相关状态
const showAddForm = ref(false);
const formData = ref({
  name: '',
  baseUrl: '',
  apiKey: '',
  modelId: ''
});

// 返回上一页
function goBack() {
  uni.navigateBack();
}

// 选择模型
function selectModel(modelId) {
  try {
    switchModel(modelId);
    uni.showToast({
      title: '切换成功',
      icon: 'success'
    });
  } catch (e) {
    uni.showToast({
      title: e.message || '切换失败',
      icon: 'none'
    });
  }
}

// 编辑密钥
function editKey(model) {
  editingModel.value = model;
  editingApiKey.value = model.apiKey || '';
  showPassword.value = false;
  showKeyModal.value = true;
}

// 保存 API Key
function saveApiKey() {
  if (!editingApiKey.value.trim()) {
    uni.showToast({
      title: '请输入 API Key',
      icon: 'none'
    });
    return;
  }
  
  const success = updateModelKey(editingModel.value.id, editingApiKey.value.trim());
  
  if (success) {
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    });
    showKeyModal.value = false;
  } else {
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
}

// 测试连接
async function testConnection() {
  if (!editingApiKey.value.trim()) {
    uni.showToast({
      title: '请先输入 API Key',
      icon: 'none'
    });
    return;
  }
  
  // 先保存 Key，确保配置同步
  const success = updateModelKey(editingModel.value.id, editingApiKey.value.trim());
  if (!success) {
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
    return;
  }
  
  uni.showLoading({ title: '测试中...' });
  
  try {
    await testModelConnection(editingModel.value.id);
    uni.hideLoading();
    uni.showToast({
      title: '连接成功! ✓',
      icon: 'success'
    });
  } catch (error) {
    uni.hideLoading();
    
    const errMsg = error.error?.message || error.errMsg || '连接失败';
    uni.showModal({
      title: '测试失败',
      content: errMsg,
      showCancel: false
    });
  }
}

// 保存自定义模型
function saveCustomModel() {
  // 验证表单
  if (!formData.value.name || !formData.value.baseUrl || !formData.value.apiKey || !formData.value.modelId) {
    uni.showToast({
      title: '请填写所有字段',
      icon: 'none'
    });
    return;
  }
  
  try {
    addCustomModel(formData.value);
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    });
    
    // 重置表单
    formData.value = {
      name: '',
      baseUrl: '',
      apiKey: '',
      modelId: ''
    };
    showAddForm.value = false;
  } catch (e) {
    uni.showToast({
      title: e.message || '添加失败',
      icon: 'none'
    });
  }
}

// 删除模型
function deleteModel(modelId) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个自定义模型吗？',
    success: (res) => {
      if (res.confirm) {
        const success = deleteCustomModel(modelId);
        if (success) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    }
  });
}

onLoad(() => {
  console.log('[AI Selector] 页面加载');
});
</script>

<style lang="scss" scoped>
.ai-selector {
  min-height: 100vh;
  background: #1e272e;
  padding-bottom: 40rpx;
}

/* 导航栏 */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2f3542;
  padding: 20rpx;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 60rpx;
}

.back-icon {
  font-size: 40rpx;
  color: #ffa502;
  font-weight: bold;
}

.nav-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.nav-placeholder {
  width: 60rpx;
}

/* 当前模型 */
.current-model {
  background: linear-gradient(135deg, #667eea, #764ba2);
  margin: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}

.current-label {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  display: block;
  margin-bottom: 12rpx;
}

.current-info {
  display: flex;
  align-items: center;
}

.current-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.current-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.current-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.current-desc {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
  margin-top: 4rpx;
}

/* 分区 */
.section {
  margin: 20rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffa502;
}

.add-btn {
  background: #2ed573;
  color: #fff;
  border: none;
  font-size: 12px;
  padding: 8rpx 20rpx;
}

.empty-tip {
  text-align: center;
  padding: 40rpx 0;
  color: #747d8c;
  font-size: 12px;
}

/* 模型卡片 */
.model-card {
  background: #2f3542;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.model-card.active {
  border-color: #2ed573;
  background: #353d4a;
}

.model-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.model-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.model-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.model-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.model-desc {
  font-size: 11px;
  color: #747d8c;
  margin-top: 4rpx;
}

.model-status {
  margin-left: 12rpx;
}

.status-badge {
  font-size: 10px;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  display: inline-block;
}

.active-badge {
  background: #2ed573;
  color: #fff;
}

.ready-badge {
  background: #57606f;
  color: #fff;
}

.warning-badge {
  background: #ffa502;
  color: #fff;
}

/* 操作按钮 */
.model-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  font-size: 12px;
  border: none;
  padding: 8rpx 20rpx;
}

.config-btn {
  background: #5f27cd;
  color: #fff;
}

.use-btn {
  background: #2ed573;
  color: #fff;
}

.delete-btn {
  background: #ee5a6f;
  color: #fff;
}

/* 模态框 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #2f3542;
  width: 80%;
  border-radius: 16rpx;
  overflow: hidden;
}

.large-modal {
  width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1px solid #57606f;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.modal-close {
  font-size: 32rpx;
  color: #747d8c;
  font-weight: bold;
}

.modal-body {
  padding: 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
  position: relative;
}

.form-label {
  display: block;
  font-size: 12px;
  color: #ffa502;
  margin-bottom: 8rpx;
}

.form-input {
  width: 100%;
  background: #1e272e;
  border: 1px solid #57606f;
  border-radius: 8rpx;
  padding: 16rpx;
  color: #fff;
  font-size: 14px;
}

.eye-icon {
  position: absolute;
  right: 16rpx;
  top: 50%;
  font-size: 20rpx;
  cursor: pointer;
}

.form-tip {
  font-size: 11px;
  color: #747d8c;
  margin-top: -12rpx;
}

.modal-footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-top: 1px solid #57606f;
}

.modal-btn {
  flex: 1;
  border: none;
  border-radius: 8rpx;
  font-size: 14px;
  padding: 16rpx 0;
}

.test-btn {
  background: #5f27cd;
  color: #fff;
}

.save-btn {
  background: #2ed573;
  color: #fff;
}

.cancel-btn {
  background: #57606f;
  color: #fff;
}
</style>
