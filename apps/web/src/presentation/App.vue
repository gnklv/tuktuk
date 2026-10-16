<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useAppLifecycle } from './composables/use-app-lifecycle'
import { useDocumentSync } from './composables/use-document-sync'
import ToastHost from './features/toasts/ToastHost.vue'

useAppLifecycle()
useDocumentSync()
</script>

<template>
  <main class="layout">
    <RouterView />
  </main>
  <ToastHost />
</template>

<style scoped>
.layout {
  max-width: 480px;
  margin: 0 auto;
  /* Standalone on iPhone: content goes under the notch and the home indicator. */
  padding: max(var(--space-5), env(safe-area-inset-top))
    max(var(--space-4), env(safe-area-inset-right)) max(var(--space-5), env(safe-area-inset-bottom))
    max(var(--space-4), env(safe-area-inset-left));
}
</style>
