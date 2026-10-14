<script setup lang="ts">
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="ui-checkbox" :class="{ 'ui-checkbox--checked': checked }">
    <input v-model="checked" type="checkbox" class="visually-hidden" />
    <span class="ui-checkbox__box" aria-hidden="true">
      <svg viewBox="0 0 24 24" class="ui-checkbox__mark">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
    <span class="ui-checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.ui-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: var(--tap-min);
  cursor: pointer;
  user-select: none;
}

.ui-checkbox__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  transition:
    background-color var(--duration-base) var(--ease-out),
    border-color var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-spring);
}

.ui-checkbox__mark {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--color-on-accent);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  transition: stroke-dashoffset var(--duration-base) var(--ease-out);
}

.ui-checkbox--checked .ui-checkbox__box {
  border-color: var(--color-success-strong);
  background: var(--color-success);
  transform: scale(1.1);
}

.ui-checkbox--checked .ui-checkbox__mark {
  stroke-dashoffset: 0;
}

.ui-checkbox:has(:focus-visible) .ui-checkbox__box {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.ui-checkbox__label {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
