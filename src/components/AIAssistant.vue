<template>
  <div 
    class="ai-assistant" 
    :style="{ width: `${width}px` }"
    ref="aiContainer"
  >
    <!-- 标题栏 -->
    <div class="ai-header">
      <div class="ai-header__info" @click="togglePanel">
        <span class="ai-icon">🤖</span>
        <span class="ai-title">紫砂知音</span>
        <span class="ai-subtitle">AI 文化顾问</span>
      </div>
      
      <div class="ai-header__actions">
        <!-- 隐藏按钮 -->
        <button class="ai-hide-btn" @click.stop="hidePanel" title="隐藏面板">
          👁️
        </button>
        <!-- 展开/收起按钮 -->
        <span class="ai-toggle-icon" @click.stop="togglePanel">
          {{ isOpen ? '▼' : '◀' }}
        </span>
      </div>
    </div>

    <!-- 聊天面板 -->
    <div v-if="isOpen" class="ai-panel">
      <!-- 聊天记录 -->
      <div class="ai-messages" ref="messagesContainer">
        <div 
          v-for="(msg, index) in messages" 
          :key="index"
          class="ai-message"
          :class="msg.type"
        >
          <div class="ai-message__avatar">
            {{ msg.type === 'user' ? '👤' : '🪷' }}
          </div>
          <div class="ai-message__content">
            {{ msg.content }}
          </div>
        </div>
        
        <!-- 正在输入中 -->
        <div v-if="isLoading" class="ai-message assistant">
          <div class="ai-message__avatar">🪷</div>
          <div class="ai-typing">
            <span>紫砂知音正在思考</span>
            <span class="dots">...</span>
          </div>
        </div>
      </div>

      <!-- 快捷问题 -->
      <div class="ai-quick-questions">
        <div 
          v-for="(q, i) in quickQuestions.slice(0, 4)" 
          :key="i"
          class="quick-btn"
          @click="sendQuickQuestion(q)"
        >
          {{ q }}
        </div>
      </div>

      <!-- 输入框 -->
      <div class="ai-input-area">
        <input
          v-model="inputMessage"
          type="text"
          placeholder="询问紫砂文化、器型、养壶知识..."
          class="ai-input"
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <button 
          class="ai-send-btn"
          @click="sendMessage"
          :disabled="isLoading || !inputMessage.trim()"
        >
          发送
        </button>
      </div>
    </div>

    <!-- 拖拽手柄 -->
    <div 
      v-if="isOpen"
      class="ai-resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { defineEmits } from 'vue';
import { aiKnowledge, quickQuestions } from '../data/aiKnowledge.js';
import { useAIAssistant } from '../composables/useAIAssistant.js';

const isOpen = ref(true); // 控制聊天面板是否展开
const messages = ref([
  {
    type: 'assistant',
    content: '你好！我是紫砂知音，很高兴为你解答紫砂文化相关问题。你可以问我关于壶型、纹理寓意、泥料特性或养壶知识等问题。'
  }
]);
const inputMessage = ref('');
const messagesContainer = ref(null);
const aiContainer = ref(null);
const width = ref(320); // 默认宽度

const emit = defineEmits(['hide']);
const { callDeepSeek, isLoading, error, hasApiKey } = useAIAssistant();

let isResizing = false;
let startX = 0;
let startWidth = 0;

// 加载保存的宽度
const loadSavedWidth = () => {
  const savedWidth = localStorage.getItem('aiAssistantWidth');
  if (savedWidth) {
    const w = parseInt(savedWidth);
    if (w >= 240 && w <= 480) {
      width.value = w;
    }
  }
};

// 保存宽度
const saveWidth = () => {
  localStorage.setItem('aiAssistantWidth', width.value);
};

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

const hidePanel = () => {
  // 通过 emit 通知父组件隐藏
  emit('hide');
};

const showAI = () => {
  isOpen.value = true;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const addMessage = (type, content) => {
  messages.value.push({ type, content });
  scrollToBottom();
};

const sendMessage = async () => {
  const text = inputMessage.value.trim();
  if (!text || isLoading.value) return;

  addMessage('user', text);
  inputMessage.value = '';

  try {
    const response = await callDeepSeek(text, messages.value);
    addMessage('assistant', response);
  } catch (err) {
    addMessage('assistant', `抱歉，出错了：${err.message}`);
  }
};

const sendQuickQuestion = (question) => {
  inputMessage.value = question;
  sendMessage();
};

// 拖拽调节宽度
const startResize = (e) => {
  isResizing = true;
  startX = e.clientX;
  startWidth = width.value;
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const onMouseMove = (e) => {
  if (!isResizing) return;
  
  const delta = startX - e.clientX; // 向左拖动增加宽度
  let newWidth = startWidth + delta;
  
  // 限制范围
  newWidth = Math.max(240, Math.min(480, newWidth));
  width.value = newWidth;
};

const onMouseUp = () => {
  if (isResizing) {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    saveWidth();
  }
};

onMounted(() => {
  loadSavedWidth();
  scrollToBottom();
});

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});

// 暴露方法给父组件
defineExpose({
  showAI,
  hidePanel
});
</script>

<style scoped>
.ai-assistant {
  position: relative;
  border-left: 1px solid #e5e5e5;
  background: white;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
  transition: width 0.1s ease;
  min-width: 240px;
  max-width: 480px;
  height: 100%;
  overflow: hidden;
}

.ai-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #5c3318, #8d5524);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255,255,255,0.15);
  flex-shrink: 0;
}

.ai-header:hover {
  background: linear-gradient(135deg, #4a2a14, #7a4a20);
}

.ai-header__info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.ai-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-icon {
  font-size: 20px;
}

.ai-title {
  font-weight: 600;
  font-size: 15px;
}

.ai-subtitle {
  font-size: 12px;
  opacity: 0.85;
}

.ai-hide-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.85);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  line-height: 1;
}

.ai-hide-btn:hover {
  background: rgba(255,255,255,0.15);
  color: white;
}

.ai-toggle-icon {
  font-size: 18px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: transform 0.2s;
}

.ai-toggle-icon:hover {
  background: rgba(255,255,255,0.15);
}

.ai-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.ai-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8f5f0;
}

.ai-message {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.ai-message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.ai-message__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ai-message__content {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.5;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.ai-message.user .ai-message__content {
  background: #5c3318;
  color: white;
}

.ai-typing {
  padding: 12px 16px;
  color: #666;
  font-size: 13px;
}

.ai-quick-questions {
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  font-size: 12px;
  padding: 6px 12px;
  background: #f0e6d9;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #d4c3a8;
  transform: translateY(-1px);
}

.ai-input-area {
  padding: 12px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
}

.ai-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
}

.ai-input:focus {
  border-color: #8d5524;
}

.ai-send-btn {
  padding: 0 20px;
  background: #8d5524;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  flex-shrink: 0;
}

.ai-send-btn:hover:not(:disabled) {
  background: #5c3318;
}

.ai-send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 拖拽手柄 */
.ai-resize-handle {
  position: absolute;
  top: 0;
  left: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
  transition: background 0.2s;
}

.ai-resize-handle:hover,
.ai-resize-handle:active {
  background: rgba(140, 85, 36, 0.3);
}

.ai-resize-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3px;
  height: 60px;
  background: #8d5524;
  opacity: 0.3;
  border-radius: 3px;
}

.ai-resize-handle:hover::after,
.ai-resize-handle:active::after {
  opacity: 0.6;
}
</style>
