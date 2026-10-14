<script setup lang="ts" generic="T extends string | number">
/** Multi-select row of toggle chips. */
const model = defineModel<T[]>({ required: true })

defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
}>()

function toggle(value: T) {
  model.value = model.value.includes(value)
    ? model.value.filter((v) => v !== value)
    : [...model.value, value]
}
</script>

<template>
  <div class="ui-chip-group" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="ui-chip"
      :class="{ 'ui-chip--on': model.includes(option.value) }"
      :aria-pressed="model.includes(option.value)"
      @click="toggle(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.ui-chip {
  min-width: 44px;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    border-color var(--duration-fast),
    color var(--duration-fast),
    transform var(--duration-fast) var(--ease-spring);
}

.ui-chip:active {
  transform: scale(0.94);
}

.ui-chip--on {
  border-color: var(--color-accent);
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}
</style>
