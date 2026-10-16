<script setup lang="ts">
import type { Component } from 'vue'

/**
 * Round icon-only button. `label` is required: it's the accessible name.
 * Pass `as` (e.g. `RouterLink` with `to`) to render a link with the same look.
 */
const { as } = defineProps<{ label: string; as?: string | Component }>()
</script>

<template>
  <component
    :is="as ?? 'button'"
    :type="as ? undefined : 'button'"
    class="ui-icon-button"
    :aria-label="label"
    :title="label"
  >
    <slot />
  </component>
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
</style>
