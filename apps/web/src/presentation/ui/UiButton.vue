<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'md' | 'lg'

const {
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
} = defineProps<{
  variant?: Variant
  size?: Size
  block?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
}>()
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="ui-button"
    :class="[`ui-button--${variant}`, `ui-button--${size}`, { 'ui-button--block': block }]"
  >
    <slot />
  </button>
</template>

<style scoped>
.ui-button {
  --_bg: var(--color-accent);
  --_edge: var(--color-accent-strong);
  --_fg: var(--color-on-accent);
  --_border: transparent;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--tap-min);
  padding: 0 var(--space-5);
  border: var(--border-width) solid var(--_border);
  border-radius: var(--radius-lg);
  background: var(--_bg);
  color: var(--_fg);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  user-select: none;
  /* The "3D" bottom edge; pressing moves the button down onto it. */
  box-shadow: 0 var(--depth) 0 var(--_edge);
  margin-bottom: var(--depth);
  transition:
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    filter var(--duration-fast);
}

.ui-button:hover:not(:disabled) {
  filter: brightness(1.05);
}

.ui-button:active:not(:disabled) {
  transform: translateY(var(--depth));
  box-shadow: 0 0 0 var(--_edge);
}

.ui-button:disabled {
  --_bg: var(--color-border);
  --_edge: var(--color-border);
  --_fg: var(--color-text-muted);
  cursor: not-allowed;
}

.ui-button--secondary {
  --_bg: var(--color-surface);
  --_edge: var(--color-border);
  --_fg: var(--color-accent-strong);
  --_border: var(--color-border);
}

.ui-button--danger {
  --_bg: var(--color-danger);
  --_edge: var(--color-danger-strong);
}

.ui-button--ghost {
  --_bg: transparent;
  --_edge: transparent;
  --_fg: var(--color-accent-strong);
}

.ui-button--lg {
  min-height: 56px;
  font-size: var(--font-size-lg);
}

.ui-button--block {
  display: flex;
  width: 100%;
}
</style>
