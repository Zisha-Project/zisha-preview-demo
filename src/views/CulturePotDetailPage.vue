<template>
  <div class="culture-inner culture-inner--detail">
    <template v-if="currentPot">
      <h1 class="culture-h1">{{ currentPot.title }} 介绍</h1>
      <p class="culture-lead">
        对应定制预览中的 {{ currentPot.modelLabel }}。下述内容用于帮助你在体验中理解该器型的视觉特征与审美取向。
      </p>

      <section class="culture-section">
        <h2 class="culture-h2">器型特点</h2>
        <p class="culture-p">{{ currentPot.intro }}</p>
        <ul class="culture-list">
          <li v-for="feature in currentPot.features" :key="feature">{{ feature }}</li>
        </ul>
      </section>

      <hr class="culture-hr" />

      <section class="culture-section">
        <h2 class="culture-h2">搭配建议</h2>
        <p class="culture-p">
          可先在预览页切换至 {{ currentPot.modelLabel }}，再尝试不同泥色与纹理组合，观察器型轮廓与纹理细节在光线下的变化。
        </p>
      </section>
    </template>

    <section v-else class="culture-section">
      <h1 class="culture-h1">未找到该壶型</h1>
      <p class="culture-p">请选择左侧菜单中的有效壶型条目。</p>
      <RouterLink :to="{ name: 'culture-overview' }" class="culture-action-link">
        返回文化总览
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { potTypes } from '../data/cultureData.js';

const route = useRoute();

const currentPot = computed(() => potTypes.find((item) => item.id === route.params.potId));
</script>
