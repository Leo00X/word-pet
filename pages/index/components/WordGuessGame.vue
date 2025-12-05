<template>
  <view class="game-overlay" v-if="visible">
    <view class="game-container" @tap.stop>
      <!-- 游戏头部 -->
      <view class="game-header">
        <view class="header-left">
          <text class="game-title">🎮 猜单词挑战</text>
          <text class="game-subtitle">回答正确获得经验和金币！</text>
        </view>
        <text class="close-btn" @tap="closeGame">✕</text>
      </view>

      <!-- 游戏状态 -->
      <view class="game-stats">
        <view class="stat-item">
          <text class="stat-label">得分</text>
          <text class="stat-value score">{{ score }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">连击</text>
          <text class="stat-value combo" :class="{ 'combo-active': combo > 1 }">
            {{ combo }}x
          </text>
        </view>
        <view class="stat-item">
          <text class="stat-label">剩余</text>
          <text class="stat-value remaining">{{ remainingQuestions }}</text>
        </view>
      </view>

      <!-- 问题区域 -->
      <view class="question-area" v-if="currentQuestion && !gameOver">
        <view class="question-card">
          <text class="question-hint">{{ currentQuestion.hint }}</text>
          <text class="question-category">{{ currentQuestion.category }}</text>
        </view>

        <!-- 字母提示 -->
        <view class="letter-hint" v-if="showLetterHint">
          <text v-for="(letter, index) in letterHintDisplay" :key="index" class="letter-box">
            {{ letter }}
          </text>
        </view>

        <!-- 输入区域 -->
        <view class="input-area">
          <input 
            class="answer-input"
            :class="{ 'shake': isWrong }"
            v-model="userAnswer"
            placeholder="输入答案..."
            :focus="inputFocus"
            @confirm="submitAnswer"
          />
          <button class="submit-btn" @tap="submitAnswer" :disabled="!userAnswer.trim()">
            提交
          </button>
        </view>

        <!-- 提示按钮 -->
        <view class="hint-actions">
          <button class="hint-btn" @tap="useLetterHint" :disabled="letterHintUsed">
            💡 首字母提示
          </button>
          <button class="hint-btn skip-btn" @tap="skipQuestion">
            ⏭️ 跳过 (-5分)
          </button>
        </view>
      </view>

      <!-- 答题结果 -->
      <view class="result-display" v-if="lastResult">
        <view class="result-card" :class="lastResult.correct ? 'correct' : 'wrong'">
          <text class="result-emoji">{{ lastResult.correct ? '✅' : '❌' }}</text>
          <text class="result-text">{{ lastResult.message }}</text>
          <text class="result-answer" v-if="!lastResult.correct">
            正确答案: {{ lastResult.correctAnswer }}
          </text>
        </view>
      </view>

      <!-- 游戏结束 -->
      <view class="game-over" v-if="gameOver">
        <view class="game-over-card">
          <text class="over-emoji">🏆</text>
          <text class="over-title">游戏结束!</text>
          
          <view class="final-stats">
            <view class="final-stat">
              <text class="final-label">最终得分</text>
              <text class="final-value">{{ score }}</text>
            </view>
            <view class="final-stat">
              <text class="final-label">正确率</text>
              <text class="final-value">{{ correctRate }}%</text>
            </view>
            <view class="final-stat">
              <text class="final-label">最高连击</text>
              <text class="final-value">{{ maxCombo }}x</text>
            </view>
          </view>

          <view class="rewards">
            <text class="reward-title">获得奖励</text>
            <view class="reward-items">
              <text class="reward-item">⭐ {{ earnedXP }} 经验</text>
              <text class="reward-item">💰 {{ earnedCoins }} 金币</text>
            </view>
          </view>

          <view class="over-actions">
            <button class="action-btn restart-btn" @tap="restartGame">
              🔄 再来一局
            </button>
            <button class="action-btn exit-btn" @tap="closeGame">
              退出
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
// 单词题库
const WORD_BANK = [
  // 基础词汇
  { word: 'apple', hint: '一种常见的水果，红色或绿色', category: '🍎 水果' },
  { word: 'book', hint: '用来阅读的东西，有很多页', category: '📚 物品' },
  { word: 'cat', hint: '常见的毛茸茸宠物，会喵喵叫', category: '🐱 动物' },
  { word: 'dog', hint: '人类最好的朋友，会汪汪叫', category: '🐕 动物' },
  { word: 'sun', hint: '天空中最亮的星球，给我们光和热', category: '☀️ 自然' },
  { word: 'moon', hint: '夜晚出现在天空，有阴晴圆缺', category: '🌙 自然' },
  { word: 'water', hint: '生命之源，透明的液体', category: '💧 自然' },
  { word: 'tree', hint: '有树干和树叶的植物', category: '🌳 植物' },
  
  // 中级词汇
  { word: 'happy', hint: '开心、快乐的意思', category: '😊 情绪' },
  { word: 'study', hint: '学习、研究的意思', category: '📖 动作' },
  { word: 'friend', hint: '朋友、好友的意思', category: '👫 关系' },
  { word: 'school', hint: '学习知识的地方', category: '🏫 地点' },
  { word: 'music', hint: '用耳朵欣赏的艺术', category: '🎵 艺术' },
  { word: 'phone', hint: '用来打电话和上网的设备', category: '📱 科技' },
  { word: 'dream', hint: '睡觉时会做的事，也指愿望', category: '💭 概念' },
  { word: 'smile', hint: '开心时嘴角上扬的表情', category: '😊 动作' },
  
  // 高级词汇
  { word: 'challenge', hint: '挑战、考验的意思', category: '💪 概念' },
  { word: 'beautiful', hint: '形容非常好看、漂亮', category: '✨ 形容词' },
  { word: 'knowledge', hint: '知识、学问的意思', category: '🧠 概念' },
  { word: 'adventure', hint: '冒险、探险的意思', category: '🗺️ 概念' }
];

export default {
  name: 'WordGuessGame',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      // 游戏状态
      questions: [],
      currentQuestionIndex: 0,
      userAnswer: '',
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      totalAnswered: 0,
      gameOver: false,
      
      // UI状态
      inputFocus: false,
      isWrong: false,
      lastResult: null,
      showLetterHint: false,
      letterHintUsed: false,
      
      // 奖励
      earnedXP: 0,
      earnedCoins: 0
    };
  },

  computed: {
    currentQuestion() {
      return this.questions[this.currentQuestionIndex];
    },
    
    remainingQuestions() {
      return this.questions.length - this.currentQuestionIndex;
    },
    
    correctRate() {
      if (this.totalAnswered === 0) return 0;
      return Math.round((this.correctCount / this.totalAnswered) * 100);
    },
    
    letterHintDisplay() {
      if (!this.currentQuestion) return [];
      const word = this.currentQuestion.word;
      const result = [];
      for (let i = 0; i < word.length; i++) {
        if (i === 0 && this.showLetterHint) {
          result.push(word[i].toUpperCase());
        } else {
          result.push('_');
        }
      }
      return result;
    }
  },

  watch: {
    visible(newVal) {
      if (newVal) {
        this.initGame();
      }
    }
  },

  methods: {
    /**
     * 初始化游戏
     */
    initGame() {
      // 随机选择10道题
      const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
      this.questions = shuffled.slice(0, 10);
      
      // 重置状态
      this.currentQuestionIndex = 0;
      this.userAnswer = '';
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.correctCount = 0;
      this.totalAnswered = 0;
      this.gameOver = false;
      this.lastResult = null;
      this.showLetterHint = false;
      this.letterHintUsed = false;
      this.earnedXP = 0;
      this.earnedCoins = 0;
      
      // 聚焦输入框
      setTimeout(() => {
        this.inputFocus = true;
      }, 300);
    },

    /**
     * 提交答案
     */
    submitAnswer() {
      if (!this.userAnswer.trim() || this.gameOver) return;
      
      const answer = this.userAnswer.trim().toLowerCase();
      const correct = answer === this.currentQuestion.word.toLowerCase();
      
      this.totalAnswered++;
      
      if (correct) {
        // 正确
        this.correctCount++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 计算得分（基础10分 + 连击奖励）
        const baseScore = 10;
        const comboBonus = Math.min(this.combo - 1, 5) * 2; // 最多+10
        const addScore = baseScore + comboBonus;
        this.score += addScore;
        
        this.lastResult = {
          correct: true,
          message: `+${addScore}分${this.combo > 1 ? ` (${this.combo}连击!)` : ''}`
        };
        
        // 触觉反馈
        uni.vibrateShort({ type: 'light' });
        
      } else {
        // 错误
        this.combo = 0;
        this.isWrong = true;
        
        this.lastResult = {
          correct: false,
          message: '答错了！',
          correctAnswer: this.currentQuestion.word
        };
        
        // 抖动动画
        setTimeout(() => {
          this.isWrong = false;
        }, 500);
        
        // 触觉反馈
        uni.vibrateShort({ type: 'medium' });
      }

      // 清空输入
      this.userAnswer = '';
      this.showLetterHint = false;
      this.letterHintUsed = false;

      // 延迟后进入下一题
      setTimeout(() => {
        this.lastResult = null;
        this.nextQuestion();
      }, 1500);
    },

    /**
     * 下一题
     */
    nextQuestion() {
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.inputFocus = true;
      } else {
        this.endGame();
      }
    },

    /**
     * 使用字母提示
     */
    useLetterHint() {
      if (this.letterHintUsed) return;
      this.showLetterHint = true;
      this.letterHintUsed = true;
      this.score = Math.max(0, this.score - 2); // 扣2分
    },

    /**
     * 跳过问题
     */
    skipQuestion() {
      this.totalAnswered++;
      this.combo = 0;
      this.score = Math.max(0, this.score - 5);
      
      this.lastResult = {
        correct: false,
        message: '已跳过 -5分',
        correctAnswer: this.currentQuestion.word
      };

      this.userAnswer = '';
      this.showLetterHint = false;
      this.letterHintUsed = false;

      setTimeout(() => {
        this.lastResult = null;
        this.nextQuestion();
      }, 1500);
    },

    /**
     * 结束游戏
     */
    endGame() {
      this.gameOver = true;
      
      // 计算奖励
      this.earnedXP = Math.round(this.score * 1.5);
      this.earnedCoins = Math.round(this.score * 0.5);
      
      // 额外奖励
      if (this.correctRate >= 80) {
        this.earnedXP += 20;
        this.earnedCoins += 10;
      }
      if (this.maxCombo >= 5) {
        this.earnedXP += 15;
        this.earnedCoins += 5;
      }
      
      // 发送奖励事件
      this.$emit('game-end', {
        score: this.score,
        correctRate: this.correctRate,
        maxCombo: this.maxCombo,
        rewards: {
          xp: this.earnedXP,
          coins: this.earnedCoins
        }
      });
    },

    /**
     * 重新开始
     */
    restartGame() {
      this.initGame();
    },

    /**
     * 关闭游戏
     */
    closeGame() {
      this.$emit('close');
    }
  }
};
</script>

<style lang="scss" scoped>
.game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-container {
  width: 90%;
  max-width: 380px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 217, 255, 0.2);
  border: 1px solid rgba(0, 217, 255, 0.3);
}

/* 头部 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  flex-direction: column;
}

.game-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.game-subtitle {
  font-size: 11px;
  color: #747d8c;
  margin-top: 3px;
}

.close-btn {
  font-size: 22px;
  color: #747d8c;
  padding: 5px;
}

/* 游戏状态 */
.game-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 11px;
  color: #747d8c;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
}

.stat-value.score { color: #ffd700; }
.stat-value.combo { color: #ff6b6b; }
.stat-value.remaining { color: #00d9ff; }

.combo-active {
  animation: pulse 0.3s ease;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* 问题区域 */
.question-area {
  padding: 20px;
}

.question-card {
  background: linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(255, 102, 204, 0.1));
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(0, 217, 255, 0.2);
}

.question-hint {
  font-size: 16px;
  color: #fff;
  line-height: 1.5;
  display: block;
}

.question-category {
  font-size: 12px;
  color: #00d9ff;
  margin-top: 10px;
  display: block;
}

/* 字母提示 */
.letter-hint {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 15px;
}

.letter-box {
  width: 28px;
  height: 36px;
  background: #2f3542;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #00d9ff;
  font-family: monospace;
}

/* 输入区域 */
.input-area {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.answer-input {
  flex: 1;
  height: 44px;
  background: #2f3542;
  border: 1px solid #57606f;
  border-radius: 10px;
  padding: 0 15px;
  font-size: 16px;
  color: #fff;
}

.answer-input.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}

.submit-btn {
  width: 70px;
  height: 44px;
  background: linear-gradient(135deg, #00d9ff, #00b4d8);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  color: #000;
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* 提示按钮 */
.hint-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.hint-btn {
  flex: 1;
  height: 36px;
  background: #2f3542;
  border: 1px solid #57606f;
  border-radius: 8px;
  font-size: 12px;
  color: #a4b0be;
}

.hint-btn:disabled {
  opacity: 0.4;
}

.skip-btn {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

/* 结果显示 */
.result-display {
  padding: 20px;
}

.result-card {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.result-card.correct {
  background: rgba(46, 213, 115, 0.2);
  border: 1px solid #2ed573;
}

.result-card.wrong {
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid #ff4757;
}

.result-emoji {
  font-size: 40px;
  display: block;
}

.result-text {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-top: 10px;
  display: block;
}

.result-answer {
  font-size: 14px;
  color: #ff6b6b;
  margin-top: 10px;
  display: block;
}

/* 游戏结束 */
.game-over {
  padding: 20px;
}

.game-over-card {
  text-align: center;
}

.over-emoji {
  font-size: 60px;
  display: block;
}

.over-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin-top: 10px;
  display: block;
}

.final-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.final-stat {
  text-align: center;
}

.final-label {
  font-size: 11px;
  color: #747d8c;
  display: block;
}

.final-value {
  font-size: 20px;
  font-weight: bold;
  color: #00d9ff;
  display: block;
  margin-top: 5px;
}

.rewards {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.reward-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffd700;
  display: block;
  margin-bottom: 10px;
}

.reward-items {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.reward-item {
  font-size: 16px;
  color: #fff;
}

/* 结束按钮 */
.over-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
}

.restart-btn {
  background: linear-gradient(135deg, #00d9ff, #00b4d8);
  color: #000;
}

.exit-btn {
  background: #2f3542;
  color: #fff;
  border: 1px solid #57606f;
}
</style>
