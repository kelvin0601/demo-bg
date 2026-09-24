<template><main class="playground glow-playground"><GlowingEdgeOverlayCore /></main></template>
<script setup>
import { nextTick, onMounted } from "vue";
import GlowingEdgeOverlayCore from "./components/GlowingEdgeOverlayCore.vue";

onMounted(async () => {
  await nextTick();
  window.dispatchEvent(
    new CustomEvent("glowing-edge-progress", { detail: { progress: 1 } })
  );
  window.dispatchEvent(
    new CustomEvent("glowing-edge-trigger-pulse", {
      detail: { x: 1.001, y: 0.5 },
    })
  );
});
</script>
