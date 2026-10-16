<script setup lang="ts">
import { useId } from 'vue'

const model = defineModel<string>({ required: true })

const { label, hideLabel = false } = defineProps<{
  label: string
  hideLabel?: boolean
  placeholder?: string
  maxlength?: number
  error?: string | null
}>()

const id = useId()
</script>

<template>
  <div class="ui-text-field" :class="{ 'ui-text-field--error': error }">
    <label :for="id" class="ui-text-field__label" :class="{ 'visually-hidden': hideLabel }">
      {{ label }}
    </label>
    <input
      :id="id"
      v-model="model"
      class="ui-text-field__input"
      type="text"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
    />
    <p v-if="error" :id="`${id}-error`" class="ui-text-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.ui-text-field {
  display: grid;
  gap: var(--space-1);
}

.ui-text-field__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
}

.ui-text-field__input {
  width: 100%;
  min-width: 0;
  min-height: var(--tap-min);
  padding: 0 var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition: border-color var(--duration-fast);
}

.ui-text-field__input::placeholder {
  color: var(--color-text-muted);
}

.ui-text-field__input:focus-visible {
  border-color: var(--color-accent);
  outline: none;
}

.ui-text-field--error .ui-text-field__input {
  border-color: var(--color-danger);
}

.ui-text-field__error {
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>
