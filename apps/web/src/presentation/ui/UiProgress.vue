<script setup lang="ts">
/** Horizontal progress bar, `value` in 0…1. */
const { value } = defineProps<{ value: number; label: string }>()
</script>

<template>
  <div
    class="ui-progress"
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(value * 100)"
  >
    <div
      class="ui-progress__fill"
      :style="{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }"
    />
  </div>
</template>

<style scoped>
.ui-progress {
  height: 12px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: var(--color-border);
}

.ui-progress__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--color-accent);
  transition:
    width var(--duration-slow) var(--ease-out),
    background-color var(--duration-slow);
}
</style>
