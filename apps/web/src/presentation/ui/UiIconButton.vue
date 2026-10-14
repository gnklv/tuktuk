<script setup lang="ts">
/** Round icon-only button. `label` is required: it's the accessible name. */
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="ui-icon-button" :aria-label="label" :title="label">
    <slot />
  </button>
</template>

<style scoped>
.ui-icon-button {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    color var(--duration-fast);
}

.ui-icon-button:hover {
  background: var(--color-accent-soft);
  color: var(--color-text);
}

.ui-icon-button :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
