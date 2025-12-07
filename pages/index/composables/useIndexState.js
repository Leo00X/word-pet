/**
 * 页面状态集中管理 Composable
 * 职责: 统一管理 index.vue 的页面级状态
 * 
 * 包含:
 * - Tab切换状态
 * - 弹窗显示状态
 * - 计算属性
 */
import { ref, reactive, computed } from 'vue';

// Tab 常量定义
export const TABS = {
    STATUS: 'status',
    CONFIG: 'config',
    CHAT: 'chat',
    BACKPACK: 'backpack',
    DIARY: 'diary'
};

/**
 * 页面状态管理
 */
export function useIndexState(chat) {
    // ========== Tab 状态 ==========
    const currentTab = ref(TABS.STATUS);

    // ========== 弹窗状态（集中管理）==========
    const modals = reactive({
        achievement: false,   // 成就弹窗
        skin: false,          // 皮肤选择
        game: false,          // 小游戏
        market: false,        // 皮肤商城
        backup: false,        // 数据备份
        randomHistory: false  // 随机互动历史
    });

    // ========== 弹窗操作方法 ==========

    /**
     * 打开指定弹窗
     * @param {string} name - 弹窗名称
     */
    const openModal = (name) => {
        if (modals.hasOwnProperty(name)) {
            modals[name] = true;
        }
    };

    /**
     * 关闭指定弹窗
     * @param {string} name - 弹窗名称
     */
    const closeModal = (name) => {
        if (modals.hasOwnProperty(name)) {
            modals[name] = false;
        }
    };

    /**
     * 关闭所有弹窗
     */
    const closeAllModals = () => {
        Object.keys(modals).forEach(key => {
            modals[key] = false;
        });
    };

    /**
     * 切换弹窗状态
     * @param {string} name - 弹窗名称
     */
    const toggleModal = (name) => {
        if (modals.hasOwnProperty(name)) {
            modals[name] = !modals[name];
        }
    };

    // ========== 计算属性 ==========

    /**
     * 今日用户对话次数
     */
    const userMessageCount = computed(() => {
        if (!chat || !chat.messages) return 0;
        const msgs = chat.messages.value || [];
        const today = new Date().toDateString();
        const todayMsgs = msgs.filter(m => {
            if (m.role !== 'user') return false;
            const msgDate = new Date(m.timestamp).toDateString();
            return msgDate === today;
        });
        return todayMsgs.length;
    });

    // ========== 返回公开API ==========
    return {
        // Tab 状态
        currentTab,
        TABS,

        // 弹窗状态
        modals,
        openModal,
        closeModal,
        closeAllModals,
        toggleModal,

        // 计算属性
        userMessageCount
    };
}
