/**
 * useLive2dLoader.js
 * 负责读取本地 Live2D 模型文件并传递给悬浮窗 WebView
 * 
 * 解决方案：悬浮窗 WebView 在 file:// 协议下禁止 XHR
 * 因此在 uni-app 端读取文件，通过消息传递给 WebView
 */

import { ref } from 'vue';

// 模型配置
const MODEL_CONFIGS = {
    hiyori: {
        basePath: '/static/live2d-models/hiyori/',
        files: [
            'Hiyori.model3.json',
            'Hiyori.moc3',
            'Hiyori.physics3.json',
            'Hiyori.pose3.json',
            'Hiyori.cdi3.json',
            'Hiyori.2048/texture_00.png',
            'Hiyori.2048/texture_01.png',
            'motions/Hiyori_m01.motion3.json',
            'motions/Hiyori_m02.motion3.json',
            'motions/Hiyori_m03.motion3.json',
            'motions/Hiyori_m04.motion3.json',
            'motions/Hiyori_m05.motion3.json',
            'motions/Hiyori_m06.motion3.json',
            'motions/Hiyori_m07.motion3.json',
            'motions/Hiyori_m08.motion3.json',
            'motions/Hiyori_m09.motion3.json',
            'motions/Hiyori_m10.motion3.json'
        ]
    },
    shizuku: {
        basePath: '/static/live2d/model/shizuku/',
        files: [
            'shizuku.model.json',
            'shizuku.moc',
            'shizuku.physics.json',
            'shizuku.pose.json',
            'shizuku.1024/texture_00.png',
            'shizuku.1024/texture_01.png',
            'shizuku.1024/texture_02.png',
            'shizuku.1024/texture_03.png',
            'shizuku.1024/texture_04.png',
            'shizuku.1024/texture_05.png'
        ]
    }
};

export function useLive2dLoader() {
    const isLoading = ref(false);
    const loadProgress = ref(0);
    const lastError = ref(null);

    /**
     * 读取单个文件为 base64
     */
    async function readFileAsBase64(filePath) {
        return new Promise((resolve, reject) => {
            // #ifdef APP-PLUS
            plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
                entry.file((file) => {
                    const reader = new plus.io.FileReader();
                    reader.onloadend = (e) => {
                        // 返回完整的 data URL
                        resolve(e.target.result);
                    };
                    reader.onerror = (e) => {
                        reject(new Error(`读取失败: ${filePath}`));
                    };
                    reader.readAsDataURL(file);
                }, reject);
            }, reject);
            // #endif

            // #ifndef APP-PLUS
            reject(new Error('仅支持 APP 端'));
            // #endif
        });
    }

    /**
     * 加载指定模型的所有文件
     * @param {string} modelName - 模型名称 (hiyori/shizuku)
     * @returns {Promise<Array>} 文件数据数组
     */
    async function loadModelFiles(modelName) {
        const config = MODEL_CONFIGS[modelName];
        if (!config) {
            throw new Error(`未知模型: ${modelName}`);
        }

        isLoading.value = true;
        loadProgress.value = 0;
        lastError.value = null;

        const results = [];
        const total = config.files.length;

        console.log(`[Live2DLoader] 开始加载模型 ${modelName}, 共 ${total} 个文件`);

        for (let i = 0; i < config.files.length; i++) {
            const fileName = config.files[i];
            const filePath = config.basePath + fileName;

            try {
                const data = await readFileAsBase64(filePath);
                results.push({
                    name: fileName.split('/').pop(), // 文件名
                    path: fileName, // 相对路径 (用于 webkitRelativePath)
                    data: data // base64 data URL
                });
                loadProgress.value = Math.round(((i + 1) / total) * 100);
                console.log(`[Live2DLoader] 已加载 ${i + 1}/${total}: ${fileName}`);
            } catch (error) {
                console.error(`[Live2DLoader] 加载失败: ${fileName}`, error);
                lastError.value = error.message;
                // 继续加载其他文件
            }
        }

        isLoading.value = false;
        console.log(`[Live2DLoader] 加载完成, 成功 ${results.length}/${total}`);

        return results;
    }

    /**
     * 发送模型数据到悬浮窗
     * @param {object} floatWinInstance - 悬浮窗实例
     * @param {string} modelName - 模型名称
     */
    async function sendModelToFloatWindow(floatWinInstance, modelName) {
        if (!floatWinInstance) {
            console.error('[Live2DLoader] 悬浮窗实例不存在');
            return false;
        }

        try {
            const files = await loadModelFiles(modelName);

            if (files.length === 0) {
                console.error('[Live2DLoader] 没有成功加载任何文件');
                return false;
            }

            // 发送到 WebView (type 200 = 加载模型数据)
            floatWinInstance.sendDataToJs(200, JSON.stringify({
                modelName: modelName,
                files: files
            }));

            console.log(`[Live2DLoader] 已发送模型数据到悬浮窗, ${files.length} 个文件`);
            return true;
        } catch (error) {
            console.error('[Live2DLoader] 发送失败:', error);
            lastError.value = error.message;
            return false;
        }
    }

    return {
        isLoading,
        loadProgress,
        lastError,
        loadModelFiles,
        sendModelToFloatWindow,
        MODEL_CONFIGS
    };
}
