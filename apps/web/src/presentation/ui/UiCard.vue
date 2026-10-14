<script setup lang="ts">
const { as = 'div' } = defineProps<{
  as?: string
}>()
</script>

<template>
  <component :is="as" class="ui-card">
    <slot />
  </component>
</template>

<style scoped>
.ui-card {
  padding: var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 var(--depth) 0 var(--color-border);
}
</style>
