<script setup lang="ts" generic="T extends string">
const model = defineModel<T>({ required: true })

defineProps<{
  label: string
  options: readonly { value: T; label: string }[]
}>()
</script>

<template>
  <div class="ui-segmented" role="radiogroup" :aria-label="label">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      class="ui-segmented__option"
      :class="{ 'ui-segmented__option--active': model === option.value }"
      :aria-checked="model === option.value"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-segmented {
  display: inline-flex;
  padding: var(--space-1);
  gap: var(--space-1);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.ui-segmented__option {
  min-height: 36px;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    color var(--duration-fast);
}

.ui-segmented__option--active {
  background: var(--color-accent-soft);
  color: var(--color-accent-strong);
}
</style>
