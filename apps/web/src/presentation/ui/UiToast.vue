<script setup lang="ts">
/** A short message floating above the content. Errors are announced immediately. */
defineProps<{ message: string; tone?: 'info' | 'error' }>()
</script>

<template>
  <div
    class="ui-toast"
    :class="`ui-toast--${tone ?? 'info'}`"
    :role="tone === 'error' ? 'alert' : 'status'"
  >
    {{ message }}
  </div>
</template>

<style scoped>
.ui-toast {
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 var(--depth) 0 var(--color-border);
  font-weight: var(--font-weight-bold);
}

.ui-toast--error {
  border-color: var(--color-danger);
  box-shadow: 0 var(--depth) 0 var(--color-danger-strong);
}
</style>
