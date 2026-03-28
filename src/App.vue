<template>
  <div class="site-root">
    <SiteHeader />
    <!-- site-main 必须包在 RouterView 外层：若写在 RouterView 上会合并到子页面根节点，与 .app-layout 冲突 -->
    <div class="site-main">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import SiteHeader from './components/SiteHeader.vue';
</script>
