/**
 * 皮肤管理系统 Composable
 * 职责: 本地皮肤扫描、在线皮肤拉取、下载缓存、应用切换
 * 
 * @依赖 useGrowth (解锁条件判定)
 * @依赖 useFloatWindow (悬浮窗皮肤同步)
 */
import { ref, computed, watch } from 'vue';
import { debugLog, logError, logSuccess } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const STORAGE_KEY = 'current_skin';
const SKINS_CACHE_KEY = 'skins_cache';
const DEFAULT_SKIN_ID = 'default';

// 内置皮肤列表（打包在APK中）
const BUILTIN_SKINS = [
    {
        id: 'default',
        name: '经典幽灵',
        author: 'WordParasite',
        version: '1.0.0',
        description: '神秘的电子幽灵，漂浮在数据海洋中',
        petType: 'ghost',
        unlockCondition: null, // 无条件解锁
        preview: '/static/skins/default/preview.png',
        assets: {
            animations: {
                idle: 'css', // 使用CSS动画
                happy: 'css',
                angry: 'css'
            }
        },
        styles: {
            primaryColor: '#00d9ff',
            secondaryColor: '#ff66cc',
            bubbleStyle: 'default'
        }
    },
    {
        id: 'cyberpunk_ghost',
        name: '赛博幽灵',
        author: 'WordParasite',
        version: '1.0.0',
        description: '穿梭在数据流中的霓虹幽灵',
        petType: 'ghost',
        unlockCondition: { type: 'level', value: 10, message: '等级达到10级解锁' },
        preview: '/static/skins/cyberpunk/preview.png',
        assets: {
            animations: {
                idle: '/static/skins/cyberpunk/idle.json',
                happy: '/static/skins/cyberpunk/happy.json',
                angry: '/static/skins/cyberpunk/angry.json'
            }
        },
        styles: {
            primaryColor: '#ff00ff',
            secondaryColor: '#39ff14',
            glowEnabled: true,
            bubbleStyle: 'cyberpunk'
        }
    },
    {
        id: 'pixel_dog',
        name: '像素田园犬',
        author: 'WordParasite',
        version: '1.0.0',
        description: '忠诚的守护犬，陪伴你的学习之旅',
        petType: 'dog',
        unlockCondition: { type: 'level', value: 5, message: '等级达到5级解锁' },
        preview: '/static/skins/dog/preview.png',
        assets: {
            animations: {
                idle: 'css',
                happy: 'css',
                angry: 'css'
            }
        },
        styles: {
            primaryColor: '#ffaa00',
            secondaryColor: '#8B4513',
            bubbleStyle: 'default'
        }
    },
    {
        id: 'neon_parrot',
        name: '霓虹鹦鹉',
        author: 'WordParasite',
        version: '1.0.0',
        description: '活泼的小鸟，用歌声督促你学习',
        petType: 'cockatiel',
        unlockCondition: { type: 'level', value: 15, message: '等级达到15级解锁' },
        preview: '/static/skins/parrot/preview.png',
        assets: {
            animations: {
                idle: 'css',
                happy: 'css',
                angry: 'css'
            }
        },
        styles: {
            primaryColor: '#00ff88',
            secondaryColor: '#ffd700',
            bubbleStyle: 'default'
        }
    }
];

/**
 * 皮肤管理系统
 * @param {Object} options - 配置选项
 * @param {Object} options.growthInstance - useGrowth 实例（用于解锁判定）
 * @param {Object} options.floatWindowInstance - useFloatWindow 实例（用于悬浮窗同步）
 */
export function useSkins(options = {}) {
    const { growthInstance = null, floatWindowInstance = null } = options;

    // ========== 响应式状态 ==========
    const currentSkinId = ref(uni.getStorageSync(STORAGE_KEY) || DEFAULT_SKIN_ID);
    const localSkins = ref([...BUILTIN_SKINS]);
    const onlineSkins = ref([]);
    const downloadProgress = ref({}); // { skinId: progress }
    const isLoading = ref(false);
    const lastError = ref(null);

    // ========== 计算属性 ==========

    /**
     * 当前激活的皮肤配置
     */
    const currentSkin = computed(() => {
        const allSkins = [...localSkins.value, ...onlineSkins.value];
        return allSkins.find(s => s.id === currentSkinId.value) || BUILTIN_SKINS[0];
    });

    /**
     * 已解锁的皮肤列表
     */
    const unlockedSkins = computed(() => {
        return localSkins.value.filter(skin => {
            return checkUnlockCondition(skin.unlockCondition);
        });
    });

    /**
     * 未解锁的皮肤列表（带解锁提示）
     */
    const lockedSkins = computed(() => {
        return localSkins.value.filter(skin => {
            return !checkUnlockCondition(skin.unlockCondition);
        });
    });

    /**
     * 所有皮肤（带解锁状态）
     */
    const allSkinsWithStatus = computed(() => {
        return localSkins.value.map(skin => ({
            ...skin,
            isUnlocked: checkUnlockCondition(skin.unlockCondition),
            isActive: skin.id === currentSkinId.value
        }));
    });

    // ========== 核心方法 ==========

    /**
     * 检查皮肤解锁条件
     * @param {Object} condition - 解锁条件
     * @returns {boolean}
     */
    function checkUnlockCondition(condition) {
        if (!condition) return true; // 无条件即已解锁

        try {
            switch (condition.type) {
                case 'level':
                    if (growthInstance && growthInstance.petLevel) {
                        return growthInstance.petLevel.value >= condition.value;
                    }
                    // 无成长系统时，尝试从本地存储读取
                    const savedLevel = uni.getStorageSync('pet_level') || 1;
                    return savedLevel >= condition.value;

                case 'achievement':
                    // TODO: 接入成就系统
                    return false;

                case 'purchase':
                    // TODO: 接入商店系统
                    return false;

                default:
                    return true;
            }
        } catch (err) {
            logError('useSkins', '检查解锁条件失败', err);
            return false;
        }
    }

    /**
     * 应用皮肤
     * @param {string} skinId - 皮肤ID
     * @returns {boolean} 是否成功
     */
    function applySkin(skinId) {
        const skin = [...localSkins.value, ...onlineSkins.value].find(s => s.id === skinId);

        if (!skin) {
            uni.showToast({ title: '皮肤不存在', icon: 'error' });
            return false;
        }

        // 检查解锁条件
        if (!checkUnlockCondition(skin.unlockCondition)) {
            const msg = skin.unlockCondition?.message || '未解锁';
            uni.showToast({ title: msg, icon: 'none' });
            return false;
        }

        // 保存选择
        currentSkinId.value = skinId;
        uni.setStorageSync(STORAGE_KEY, skinId);

        // 同步到悬浮窗
        syncSkinToFloat(skin);

        logSuccess(`已切换皮肤: ${skin.name}`);
        uni.showToast({ title: `已切换到 ${skin.name}`, icon: 'success' });
        return true;
    }

    /**
     * 同步皮肤到悬浮窗
     * @param {Object} skin - 皮肤配置
     */
    function syncSkinToFloat(skin) {
        if (!floatWindowInstance || !floatWindowInstance.sendMessageToFloat) {
            debugLog('[皮肤系统]', '悬浮窗实例未就绪，跳过同步');
            return;
        }

        const skinData = {
            action: 'change_skin',
            skinId: skin.id,
            petType: skin.petType,
            animations: skin.assets?.animations || {},
            styles: skin.styles || {}
        };

        // 使用 type=99 作为皮肤切换的消息类型
        floatWindowInstance.sendMessageToFloat(99, JSON.stringify(skinData));
        debugLog('[皮肤系统]', `已同步皮肤到悬浮窗: ${skin.name}`);
    }

    /**
     * 获取皮肤预览URL
     * @param {Object} skin - 皮肤配置
     * @returns {string}
     */
    function getSkinPreviewUrl(skin) {
        if (skin.preview) {
            // #ifdef APP-PLUS
            return plus.io.convertLocalFileSystemURL(`_www${skin.preview}`);
            // #endif
            // #ifdef H5
            return skin.preview;
            // #endif
        }
        // 默认预览
        return '/static/logo.png';
    }

    /**
     * 根据宠物类型获取可用皮肤
     * @param {string} petType - 宠物类型 ID
     * @returns {Array}
     */
    function getSkinsByPetType(petType) {
        return localSkins.value.filter(skin => skin.petType === petType);
    }

    // ========== 在线皮肤功能（Phase 3 实现）==========

    /**
     * 拉取在线皮肤列表
     * @returns {Promise<Array>}
     */
    async function fetchOnlineSkins() {
        isLoading.value = true;
        lastError.value = null;

        try {
            // TODO: 替换为实际的 GitHub API 或 uniCloud 接口
            const response = await uni.request({
                url: 'https://api.github.com/repos/YOUR_USERNAME/wordparasite-skins/releases',
                method: 'GET',
                header: { 'User-Agent': 'WordParasite-App' }
            });

            if (response.statusCode === 200) {
                const releases = response.data || [];
                onlineSkins.value = releases.map(release => ({
                    id: release.tag_name,
                    name: release.name,
                    description: release.body,
                    downloadUrl: release.assets?.[0]?.browser_download_url,
                    version: release.tag_name,
                    source: 'github',
                    isOnline: true
                }));
                debugLog('[皮肤系统]', `拉取到 ${onlineSkins.value.length} 个在线皮肤`);
            }
        } catch (error) {
            lastError.value = error.message || '网络错误';
            logError('useSkins', '拉取在线皮肤失败', error);
        } finally {
            isLoading.value = false;
        }

        return onlineSkins.value;
    }

    /**
     * 下载在线皮肤
     * @param {string} skinId - 皮肤ID
     * @returns {Promise<boolean>}
     */
    async function downloadSkin(skinId) {
        const skin = onlineSkins.value.find(s => s.id === skinId);
        if (!skin || !skin.downloadUrl) {
            uni.showToast({ title: '皮肤不可用', icon: 'error' });
            return false;
        }

        downloadProgress.value[skinId] = 0;

        // #ifdef APP-PLUS
        return new Promise((resolve) => {
            const downloadTask = uni.downloadFile({
                url: skin.downloadUrl,
                success: (res) => {
                    if (res.statusCode === 200) {
                        // TODO: 解压并安装皮肤
                        delete downloadProgress.value[skinId];
                        uni.showToast({ title: '安装成功！', icon: 'success' });
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                },
                fail: (err) => {
                    logError('useSkins', '下载皮肤失败', err);
                    uni.showToast({ title: '下载失败', icon: 'error' });
                    resolve(false);
                }
            });

            downloadTask.onProgressUpdate((res) => {
                downloadProgress.value[skinId] = res.progress;
            });
        });
        // #endif

        // #ifdef H5
        uni.showToast({ title: 'H5不支持下载', icon: 'none' });
        return false;
        // #endif
    }

    // ========== 初始化 ==========

    /**
     * 验证当前皮肤是否有效
     */
    function validateCurrentSkin() {
        const allSkins = [...localSkins.value, ...onlineSkins.value];
        const exists = allSkins.some(s => s.id === currentSkinId.value);

        if (!exists) {
            debugLog('[皮肤系统]', `当前皮肤 ${currentSkinId.value} 无效，重置为默认`);
            currentSkinId.value = DEFAULT_SKIN_ID;
            uni.setStorageSync(STORAGE_KEY, DEFAULT_SKIN_ID);
        }
    }

    // 初始化时验证
    validateCurrentSkin();

    // 加载已购买的皮肤
    loadPurchasedSkins();

    debugLog('[皮肤系统]', `已加载 ${localSkins.value.length} 个本地皮肤，当前: ${currentSkinId.value}`);

    /**
     * 加载已购买的皮肤（从本地存储）
     */
    function loadPurchasedSkins() {
        try {
            const purchased = uni.getStorageSync('purchased_skins') || [];
            if (purchased.length > 0) {
                // 合并到 localSkins（避免重复）
                purchased.forEach(skin => {
                    if (!localSkins.value.some(s => s.id === skin.id)) {
                        localSkins.value.push({
                            ...skin,
                            unlockCondition: null // 购买的皮肤无条件解锁
                        });
                    }
                });
                debugLog('[皮肤系统]', `加载了 ${purchased.length} 个已购买皮肤`);
            }
        } catch (e) {
            logError('useSkins', '加载已购买皮肤失败', e);
        }
    }

    /**
     * 添加皮肤到本地列表（购买后调用）
     * @param {Object} skinData - 皮肤数据
     * @returns {boolean}
     */
    function addSkin(skinData) {
        if (!skinData || !skinData.id) {
            logError('useSkins', '无效的皮肤数据');
            return false;
        }

        // 检查是否已存在
        if (localSkins.value.some(s => s.id === skinData.id)) {
            debugLog('[皮肤系统]', `皮肤 ${skinData.id} 已存在`);
            return true;
        }

        // 构建完整皮肤配置
        const newSkin = {
            id: skinData.id,
            name: skinData.name || '未知皮肤',
            author: skinData.author || 'Unknown',
            version: skinData.version || '1.0.0',
            description: skinData.description || '',
            emoji: skinData.emoji,  // 保留原始emoji
            petType: skinData.petType || skinData.category || 'ghost',
            unlockCondition: null, // 购买的皮肤无条件解锁
            preview: skinData.preview || '/static/logo.png',
            assets: skinData.assets || {
                animations: { idle: 'css', happy: 'css', angry: 'css' }
            },
            styles: {
                primaryColor: skinData.primaryColor || '#00d9ff',
                secondaryColor: skinData.secondaryColor || '#ff66cc',
                bubbleStyle: 'default'
            },
            isPurchased: true
        };

        // 添加到本地列表
        localSkins.value.push(newSkin);

        // 持久化保存
        savePurchasedSkins();

        logSuccess(`已添加皮肤: ${newSkin.name}`);
        return true;
    }

    /**
     * 保存已购买皮肤到本地存储
     */
    function savePurchasedSkins() {
        try {
            const purchased = localSkins.value.filter(s => s.isPurchased);
            uni.setStorageSync('purchased_skins', purchased);
        } catch (e) {
            logError('useSkins', '保存皮肤失败', e);
        }
    }

    // ========== 返回公开API ==========
    return {
        // 状态
        currentSkinId,
        currentSkin,
        localSkins,
        onlineSkins,
        unlockedSkins,
        lockedSkins,
        allSkinsWithStatus,
        downloadProgress,
        isLoading,
        lastError,

        // 方法
        applySkin,
        checkUnlockCondition,
        getSkinPreviewUrl,
        getSkinsByPetType,
        syncSkinToFloat,

        // 在线功能
        fetchOnlineSkins,
        downloadSkin,

        // 购买功能
        addSkin
    };
}
