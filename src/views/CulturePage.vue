<template>
  <main class="culture-page">
    <div class="culture-layout">
      <aside class="culture-sidebar">
        <h2 class="culture-sidebar__title">文化目录</h2>

        <RouterLink
          class="culture-menu-link"
          :to="{ name: 'culture-overview' }"
          active-class="culture-menu-link--active"
        >
          总览
        </RouterLink>

        <section class="culture-menu-group">
          <button type="button" class="culture-menu-toggle" @click="toggleMenu('pot')">
            <span>壶型</span>
            <span class="culture-menu-toggle__icon">{{ isPotOpen ? '▾' : '▸' }}</span>
          </button>
          <div v-show="isPotOpen" class="culture-menu-panel">
            <RouterLink
              v-for="pot in potTypes"
              :key="pot.id"
              class="culture-menu-link"
              :to="{ name: 'culture-pot-detail', params: { potId: pot.id } }"
              active-class="culture-menu-link--active"
            >
              {{ pot.title }}
            </RouterLink>
          </div>
        </section>

        <section class="culture-menu-group">
          <button type="button" class="culture-menu-toggle" @click="toggleMenu('texture')">
            <span>纹理</span>
            <span class="culture-menu-toggle__icon">{{ isTextureOpen ? '▾' : '▸' }}</span>
          </button>
          <div v-show="isTextureOpen" class="culture-menu-panel">
            <RouterLink
              v-for="texture in textures"
              :key="texture.id"
              class="culture-menu-link"
              :to="{ name: 'culture-texture-detail', params: { textureId: texture.id } }"
              active-class="culture-menu-link--active"
            >
              {{ texture.title }}
            </RouterLink>
          </div>
        </section>

        <RouterLink to="/" class="culture-back culture-back--menu">返回定制预览</RouterLink>
      </aside>

      <section class="culture-content">
        <RouterView />
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { potTypes, textures } from '../data/cultureData.js';

const route = useRoute();

const isPotOpen = ref(route.name === 'culture-pot-detail');
const isTextureOpen = ref(route.name === 'culture-texture-detail');

watch(
  () => route.name,
  (name) => {
    if (name === 'culture-pot-detail') isPotOpen.value = true;
    if (name === 'culture-texture-detail') isTextureOpen.value = true;
  }
);

function toggleMenu(type) {
  if (type === 'pot') {
    isPotOpen.value = !isPotOpen.value;
    return;
  }
  isTextureOpen.value = !isTextureOpen.value;
}
</script>
