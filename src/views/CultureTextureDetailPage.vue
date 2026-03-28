<template>
  <div class="culture-inner culture-inner--detail">
    <template v-if="currentTexture">
      <h1 class="culture-h1">{{ currentTexture.title }} 纹理介绍</h1>
      <p class="culture-lead">
        该纹理属于“四君子”题材，对应预览页中的纹理贴花与彩绘图案，可用于表达不同器物气质。
      </p>

      <section class="culture-section">
        <h2 class="culture-h2">文化寓意</h2>
        <p class="culture-p">{{ currentTexture.meaning }}</p>
      </section>

      <hr class="culture-hr" />

      <section class="culture-section">
        <h2 class="culture-h2">纹理与彩绘对照</h2>
        <div class="culture-grid culture-grid--2col">
          <article class="culture-card">
            <h3 class="culture-h3">纹理贴图</h3>
            <div class="culture-card__media">
              <img
                :src="currentTexture.patternImage"
                :alt="`${currentTexture.title} 纹理`"
                class="culture-card__img"
              />
            </div>
          </article>
          <article class="culture-card">
            <h3 class="culture-h3">彩绘贴图</h3>
            <div class="culture-card__media">
              <img
                :src="currentTexture.paintImage"
                :alt="`${currentTexture.title} 彩绘`"
                class="culture-card__img"
              />
            </div>
          </article>
        </div>
      </section>
    </template>

    <section v-else class="culture-section">
      <h1 class="culture-h1">未找到该纹理</h1>
      <p class="culture-p">请选择左侧菜单中的有效纹理条目。</p>
      <RouterLink :to="{ name: 'culture-overview' }" class="culture-action-link">
        返回文化总览
      </RouterLink>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { textures } from '../data/cultureData.js';

const route = useRoute();

const currentTexture = computed(() =>
  textures.find((item) => item.id === route.params.textureId)
);
</script>
