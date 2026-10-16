<script setup lang="ts">
import { useId } from 'vue'

/** `HH:MM`. Updates on `change` (when the picker is committed), not on every keystroke. */
const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  disabled?: boolean
}>()

const id = useId()

function onChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) model.value = value
}
</script>

<template>
  <div class="ui-time-field">
    <label :for="id" class="ui-time-field__label">{{ label }}</label>
    <input
      :id="id"
      class="ui-time-field__input"
      type="time"
      :value="model"
      :disabled="disabled"
      @change="onChange"
    />
  </div>
</template>

<style scoped>
.ui-time-field {
  display: grid;
  gap: var(--space-1);
}

.ui-time-field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
}

.ui-time-field__input {
  width: 100%;
  min-width: 0;
  min-height: var(--tap-min);
  padding: 0 var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.ui-time-field__input:focus-visible {
  border-color: var(--color-accent);
  outline: none;
}

.ui-time-field__input:disabled {
  opacity: 0.5;
}
</style>
