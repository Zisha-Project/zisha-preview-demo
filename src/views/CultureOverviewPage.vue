<template>
  <div class="culture-inner culture-inner--detail">
    <h1 class="culture-h1">壶型与纹样寓意</h1>
    <p class="culture-lead">
      本页介绍预览中的三种壶型与「梅兰竹菊」四君子纹理，并可从左侧菜单进入每个壶型或纹理的详细说明页面。
    </p>

    <section class="culture-section">
      <h2 class="culture-h2">壶型索引</h2>
      <div class="culture-grid">
        <article v-for="pot in potTypes" :key="pot.id" class="culture-card">
          <h3 class="culture-h3">{{ pot.title }}</h3>
          <p class="culture-p culture-p--muted">对应预览页 {{ pot.modelLabel }}</p>
          <p class="culture-p">{{ pot.intro }}</p>
          <RouterLink
            class="culture-action-link"
            :to="{ name: 'culture-pot-detail', params: { potId: pot.id } }"
          >
            查看壶型详情
          </RouterLink>
        </article>
      </div>
    </section>

    <hr class="culture-hr" />

    <section class="culture-section">
      <h2 class="culture-h2">纹理索引</h2>
      <p class="culture-p culture-p--muted">
        四君子纹理对应预览页中的纹理与彩绘，点击可查看每个纹理的文化含义与使用建议。
      </p>
      <div class="culture-grid">
        <article v-for="texture in textures" :key="texture.id" class="culture-card">
          <div class="culture-card__media">
            <img :src="texture.patternImage" :alt="texture.title" class="culture-card__img" />
          </div>
          <h3 class="culture-h3">{{ texture.title }}</h3>
          <p class="culture-p">{{ texture.meaning }}</p>
          <RouterLink
            class="culture-action-link"
            :to="{ name: 'culture-texture-detail', params: { textureId: texture.id } }"
          >
            查看纹理详情
          </RouterLink>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { potTypes, textures } from '../data/cultureData.js';
</script>
