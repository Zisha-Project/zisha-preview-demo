<template>
  <div class="app-layout">
    <aside id="sidebar">
      <div class="model-btns">
        <button
          v-for="m in models"
          :key="m.url"
          type="button"
          @click="modelUrl = m.url"
        >
          {{ m.label }}
        </button>
      </div>
      <hr />

      <div class="color-area">
        <p>选择壶身材质：</p>
        <template v-for="(group, gi) in colorGroups" :key="gi">
          <p>{{ group.title }}</p>
          <button
            v-for="c in group.colors"
            :key="c.value"
            type="button"
            class="color-btn"
            :data-color="c.value"
            :style="{ background: c.value }"
            @click="bodyColor = c.value"
          >
            {{ c.label }}
          </button>
        </template>
      </div>
      <hr />

      <div class="pattern-area">
        <div v-for="p in patterns" :key="p.pattern" class="pattern-item">
          <button
            type="button"
            class="pattern-btn"
            @click="patternUrl = p.pattern"
          >
            {{ p.label }}
          </button>
          <img :src="p.pattern" :alt="p.label" class="pattern-preview" />
        </div>
      </div>
      <hr />

      <div class="paint-area">
        <p>选择彩绘图案：</p>
        <div v-for="p in paints" :key="p.paint" class="paint-item">
          <button
            type="button"
            class="paint-btn"
            @click="paintUrl = p.paint"
          >
            {{ p.label }}
          </button>
          <img :src="p.paint" :alt="p.label" class="paint-preview" />
        </div>
      </div>
      <hr />

      <div class="clear-btn-area">
        <button id="clear-decal-btn" type="button" @click="clearDecals">
          清除所有贴图
        </button>
      </div>
      <hr />

      <div class="capacity-area">
        <p>紫砂壶容量（100～500cc）：</p>
        <input
          id="capacity-input"
          ref="capacityInputEl"
          v-model="capacityInput"
          type="text"
          inputmode="numeric"
          placeholder="100-500"
          @blur="onCapacityBlur"
          @input="onCapacityInput"
          @keydown.enter.prevent="blurCapacityInput"
        />
        <div id="capacity-display">当前容量：{{ currentCapacity }} cc</div>
      </div>
      <hr />
    </aside>

    <TeapotViewer
      :model-url="modelUrl"
      :body-color="bodyColor"
      :pattern-url="patternUrl"
      :paint-url="paintUrl"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import TeapotViewer from '../components/TeapotViewer.vue';

const models = [
  { label: '模型 1', url: 'models/model1.glb' },
  { label: '模型 2', url: 'models/model2.glb' },
  { label: '模型 3', url: 'models/model3.glb' }
];

const colorGroups = [
  {
    title: '紫泥系列',
    colors: [
      { label: '底槽清', value: '#6D5B54' },
      { label: '原矿紫泥', value: '#7A6963' },
      { label: '天青泥', value: '#5C6570' }
    ]
  },
  {
    title: '朱泥系列',
    colors: [
      { label: '小煤窑朱泥', value: '#B85B46' },
      { label: '大红袍朱泥', value: '#C86B55' },
      { label: '红皮龙', value: '#A95C50' }
    ]
  },
  {
    title: '段泥系列',
    colors: [
      { label: '黄金段泥', value: '#C9B88F' },
      { label: '青段泥', value: '#A8A08D' },
      { label: '芝麻段泥', value: '#B4A990' }
    ]
  },
  {
    title: '绿泥系列',
    colors: [
      { label: '本山绿泥', value: '#8A9A86' },
      { label: '墨绿泥', value: '#6B7B6E' }
    ]
  }
];

const patterns = [
  { label: '纹理 梅', pattern: 'patterns/A.png' },
  { label: '纹理 兰', pattern: 'patterns/B.png' },
  { label: '纹理 竹', pattern: 'patterns/C.png' },
  { label: '纹理 菊', pattern: 'patterns/D.png' }
];

const paints = [
  { label: '彩绘 梅', paint: 'patterns/color/paint1.png' },
  { label: '彩绘 兰', paint: 'patterns/color/paint2.png' },
  { label: '彩绘 竹', paint: 'patterns/color/paint3.png' },
  { label: '彩绘 菊', paint: 'patterns/color/paint4.png' }
];

const modelUrl = ref('models/model1.glb');
const bodyColor = ref(null);
const patternUrl = ref(null);
const paintUrl = ref('patterns/color/invisible.png');
const currentCapacity = ref(300);

const capacityInput = ref('300');
const capacityInputEl = ref(null);

watch(currentCapacity, (n) => {
  capacityInput.value = String(n);
});

function onCapacityInput(e) {
  const v = e.target.value.replace(/[^0-9]/g, '');
  if (v !== e.target.value) {
    capacityInput.value = v;
  }
}

function blurCapacityInput() {
  capacityInputEl.value?.blur();
}

function validateAndSetCapacity(value) {
  let num = parseInt(String(value), 10);

  if (Number.isNaN(num)) {
    capacityInput.value = String(currentCapacity.value);
    return;
  }

  if (num < 100) {
    window.alert('小心！\n超出最小容量喽～\n已自动调整为 100 cc');
    num = 100;
  } else if (num > 500) {
    window.alert('小心！\n超出最大容量啦～\n已自动调整为 500 cc');
    num = 500;
  }

  num = Math.round(num / 10) * 10;
  currentCapacity.value = num;
  capacityInput.value = String(num);
}

function onCapacityBlur() {
  validateAndSetCapacity(capacityInput.value);
}

function clearDecals() {
  patternUrl.value = null;
  paintUrl.value = 'patterns/color/invisible.png';
  window.alert('已清除所有贴图！');
}
</script>
