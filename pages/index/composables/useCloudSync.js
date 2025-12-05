/**
 * 云同步服务 Composable
 * 职责: 用户数据云端备份/恢复、多设备同步
 * 
 * 存储方案:
 * - 本地: uni.setStorageSync (主)
 * - 云端: uniCloud 云对象 (可选)
 * 
 * 同步策略: 手动触发 + 时间戳冲突检测
 */
import { ref, computed } from 'vue';
import { debugLog, logError, logSuccess } from '@/utils/debugLog.js';

// ========== 常量定义 ==========
const SYNC_STATUS_KEY = 'cloud_sync_status';
const SYNC_DATA_VERSION = 1;

// 需要同步的数据键
const SYNC_KEYS = [
    'pet_growth_data',      // 成长数据
    'pet_backpack',         // 背包数据
    'growth_logs',          // 成长日志
    'ai_memory',            // AI记忆
    'current_skin',         // 当前皮肤
    'achievements_data',    // 成就数据
    'chat_history',         // 聊天历史
    'whitelist_apps',       // 白名单
    'blacklist_apps'        // 黑名单
];

/**
 * 云同步服务
 */
export function useCloudSync() {
    // ========== 响应式状态 ==========
    const isLoggedIn = ref(false);
    const userInfo = ref(null);
    const syncStatus = ref('idle'); // idle | syncing | success | error
    const lastSyncTime = ref(null);
    const syncProgress = ref(0);
    const syncError = ref(null);
    const cloudEnabled = ref(false); // uniCloud 是否可用

    // ========== 计算属性 ==========

    /**
     * 同步状态文本
     */
    const syncStatusText = computed(() => {
        switch (syncStatus.value) {
            case 'syncing': return '同步中...';
            case 'success': return '同步成功';
            case 'error': return '同步失败';
            default: return '点击同步';
        }
    });

    /**
     * 上次同步的格式化时间
     */
    const lastSyncTimeFormatted = computed(() => {
        if (!lastSyncTime.value) return '从未同步';
        const date = new Date(lastSyncTime.value);
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    });

    // ========== 初始化 ==========

    /**
     * 初始化云同步服务
     */
    async function init() {
        // 加载同步状态
        try {
            const saved = uni.getStorageSync(SYNC_STATUS_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                lastSyncTime.value = data.lastSyncTime;
            }
        } catch (err) {
            logError('useCloudSync', '加载同步状态失败', err);
        }

        // 检查 uniCloud 是否可用
        // #ifdef APP-PLUS
        try {
            if (typeof uniCloud !== 'undefined') {
                cloudEnabled.value = true;
                debugLog('[云同步]', 'uniCloud 可用');
            }
        } catch (e) {
            cloudEnabled.value = false;
        }
        // #endif

        debugLog('[云同步]', '初始化完成', { cloudEnabled: cloudEnabled.value });
    }

    // ========== 本地数据打包/解包 ==========

    /**
     * 收集所有本地数据
     * @returns {Object} 数据包
     */
    function collectLocalData() {
        const data = {
            version: SYNC_DATA_VERSION,
            timestamp: Date.now(),
            deviceInfo: getDeviceInfo(),
            items: {}
        };

        for (const key of SYNC_KEYS) {
            try {
                const value = uni.getStorageSync(key);
                if (value) {
                    data.items[key] = value;
                }
            } catch (err) {
                logError('useCloudSync', `读取 ${key} 失败`, err);
            }
        }

        debugLog('[云同步]', `收集了 ${Object.keys(data.items).length} 项数据`);
        return data;
    }

    /**
     * 恢复本地数据
     * @param {Object} data - 数据包
     */
    function restoreLocalData(data) {
        if (!data || !data.items) {
            throw new Error('数据格式无效');
        }

        let restored = 0;
        for (const [key, value] of Object.entries(data.items)) {
            try {
                if (SYNC_KEYS.includes(key)) {
                    uni.setStorageSync(key, value);
                    restored++;
                }
            } catch (err) {
                logError('useCloudSync', `恢复 ${key} 失败`, err);
            }
        }

        debugLog('[云同步]', `恢复了 ${restored} 项数据`);
        return restored;
    }

    /**
     * 获取设备信息
     */
    function getDeviceInfo() {
        try {
            const info = uni.getSystemInfoSync();
            return {
                brand: info.brand,
                model: info.model,
                platform: info.platform,
                system: info.system
            };
        } catch (e) {
            return { platform: 'unknown' };
        }
    }

    // ========== 导出/导入（本地文件）==========

    /**
     * 导出数据到本地文件
     * @returns {Promise<string>} 文件路径
     */
    async function exportToFile() {
        syncStatus.value = 'syncing';
        syncProgress.value = 0;

        try {
            const data = collectLocalData();
            const jsonString = JSON.stringify(data, null, 2);
            const fileName = `wordparasite_backup_${Date.now()}.json`;

            // #ifdef APP-PLUS
            // 保存到本地
            const filePath = `${plus.io.PUBLIC_DOCUMENTS}/${fileName}`;

            return new Promise((resolve, reject) => {
                plus.io.requestFileSystem(plus.io.PUBLIC_DOCUMENTS, (fs) => {
                    fs.root.getFile(fileName, { create: true }, (fileEntry) => {
                        fileEntry.createWriter((writer) => {
                            writer.onwrite = () => {
                                syncStatus.value = 'success';
                                syncProgress.value = 100;
                                logSuccess(`数据已导出到: ${filePath}`);
                                resolve(filePath);
                            };
                            writer.onerror = (err) => {
                                reject(err);
                            };
                            writer.write(jsonString);
                        });
                    }, reject);
                }, reject);
            });
            // #endif

            // #ifdef H5
            // H5 下载
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);

            syncStatus.value = 'success';
            return fileName;
            // #endif

        } catch (err) {
            syncStatus.value = 'error';
            syncError.value = err.message;
            logError('useCloudSync', '导出失败', err);
            throw err;
        }
    }

    /**
     * 从文件导入数据
     */
    async function importFromFile() {
        return new Promise((resolve, reject) => {
            // #ifdef APP-PLUS
            plus.io.chooseFile({
                filter: '.json',
                multiple: false
            }, (e) => {
                const file = e.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }

                plus.io.resolveLocalFileSystemURL(file, (entry) => {
                    entry.file((file) => {
                        const reader = new plus.io.FileReader();
                        reader.onloadend = (e) => {
                            try {
                                const data = JSON.parse(e.target.result);
                                const count = restoreLocalData(data);
                                syncStatus.value = 'success';
                                lastSyncTime.value = Date.now();
                                saveSyncStatus();
                                logSuccess(`导入成功，恢复了 ${count} 项数据`);
                                resolve(count);
                            } catch (err) {
                                reject(err);
                            }
                        };
                        reader.readAsText(file);
                    });
                }, reject);
            }, reject);
            // #endif

            // #ifdef H5
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        const count = restoreLocalData(data);
                        syncStatus.value = 'success';
                        lastSyncTime.value = Date.now();
                        saveSyncStatus();
                        resolve(count);
                    } catch (err) {
                        reject(err);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
            // #endif
        });
    }

    // ========== 云同步（uniCloud）==========

    /**
     * 同步到云端
     */
    async function syncToCloud() {
        if (!cloudEnabled.value) {
            uni.showToast({ title: '云服务不可用', icon: 'none' });
            return false;
        }

        syncStatus.value = 'syncing';
        syncProgress.value = 0;

        try {
            const data = collectLocalData();
            syncProgress.value = 30;

            // 调用云对象
            const cloudSync = uniCloud.importObject('cloud-sync');
            await cloudSync.saveUserData({
                data: JSON.stringify(data),
                timestamp: data.timestamp
            });

            syncProgress.value = 100;
            syncStatus.value = 'success';
            lastSyncTime.value = Date.now();
            saveSyncStatus();

            logSuccess('云同步完成');
            return true;

        } catch (err) {
            syncStatus.value = 'error';
            syncError.value = err.message;
            logError('useCloudSync', '云同步失败', err);
            return false;
        }
    }

    /**
     * 从云端恢复
     */
    async function restoreFromCloud() {
        if (!cloudEnabled.value) {
            uni.showToast({ title: '云服务不可用', icon: 'none' });
            return false;
        }

        syncStatus.value = 'syncing';
        syncProgress.value = 0;

        try {
            // 调用云对象
            const cloudSync = uniCloud.importObject('cloud-sync');
            const result = await cloudSync.getUserData();

            syncProgress.value = 50;

            if (result.data) {
                const data = JSON.parse(result.data);
                restoreLocalData(data);
            }

            syncProgress.value = 100;
            syncStatus.value = 'success';
            lastSyncTime.value = Date.now();
            saveSyncStatus();

            logSuccess('云端恢复完成');
            return true;

        } catch (err) {
            syncStatus.value = 'error';
            syncError.value = err.message;
            logError('useCloudSync', '云端恢复失败', err);
            return false;
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 保存同步状态
     */
    function saveSyncStatus() {
        try {
            uni.setStorageSync(SYNC_STATUS_KEY, JSON.stringify({
                lastSyncTime: lastSyncTime.value
            }));
        } catch (err) {
            logError('useCloudSync', '保存同步状态失败', err);
        }
    }

    /**
     * 获取数据摘要
     */
    function getDataSummary() {
        const data = collectLocalData();
        return {
            itemCount: Object.keys(data.items).length,
            totalSize: JSON.stringify(data).length,
            keys: Object.keys(data.items)
        };
    }

    // 初始化
    init();

    // ========== 返回公开API ==========
    return {
        // 状态
        isLoggedIn,
        userInfo,
        syncStatus,
        syncStatusText,
        lastSyncTime,
        lastSyncTimeFormatted,
        syncProgress,
        syncError,
        cloudEnabled,

        // 本地导入导出
        exportToFile,
        importFromFile,

        // 云同步
        syncToCloud,
        restoreFromCloud,

        // 辅助
        getDataSummary,
        collectLocalData,
        restoreLocalData
    };
}
