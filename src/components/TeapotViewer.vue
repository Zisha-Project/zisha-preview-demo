<template>
  <div ref="containerRef" class="viewer" />
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { createTeapotViewer } from '../composables/useTeapotViewer.js';

const props = defineProps({
  modelUrl: { type: String, required: true },
  bodyColor: { type: String, default: null },
  patternUrl: { type: String, default: null },
  paintUrl: { type: String, default: 'patterns/color/invisible.png' }
});

const containerRef = ref(null);
let viewer = null;

onMounted(() => {
  viewer = createTeapotViewer(containerRef.value);
  viewer.loadModel(props.modelUrl);
  if (props.bodyColor) {
    viewer.changeModelColor(props.bodyColor);
  }
  viewer.syncDecalState(props.patternUrl, props.paintUrl);
});

onBeforeUnmount(() => {
  viewer?.dispose();
  viewer = null;
});

watch(
  () => props.modelUrl,
  (url) => {
    if (viewer) viewer.loadModel(url);
  }
);

watch(
  () => props.bodyColor,
  (color) => {
    if (viewer && color) viewer.changeModelColor(color);
  }
);

watch(
  () => [props.patternUrl, props.paintUrl],
  ([patternUrl, paintUrl]) => {
    if (viewer) viewer.syncDecalState(patternUrl, paintUrl);
  }
);
</script>
