<script setup lang="ts">
import { onUnmounted, ref, watchEffect } from 'vue'
import {
  UiButton,
  UiCard,
  UiCheckbox,
  UiChipGroup,
  UiIconButton,
  UiSegmentedControl,
  UiTextField,
} from '../ui'

type Theme = 'system' | 'light' | 'dark'

const pressure = ref(0)
const theme = ref<Theme>('system')
const root = document.documentElement

watchEffect(() => {
  root.style.setProperty('--pressure', String(pressure.value))
  if (theme.value === 'system') delete root.dataset.theme
  else root.dataset.theme = theme.value
})

onUnmounted(() => {
  root.style.removeProperty('--pressure')
  delete root.dataset.theme
})

const swatches = [
  'bg',
  'surface',
  'border',
  'text',
  'text-muted',
  'accent',
  'accent-strong',
  'accent-soft',
  'success',
  'danger',
  'streak',
  'focus',
]
const fontSizes = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']

const checked = ref(true)
const text = ref('')
const segment = ref<'a' | 'b'>('a')
const chips = ref<number[]>([1, 3])
</script>

<template>
  <div class="kit">
    <h1>Design kit</h1>

    <UiCard class="controls">
      <label class="control">
        <span>Pressure: {{ pressure.toFixed(2) }}</span>
        <input v-model.number="pressure" type="range" min="0" max="1" step="0.01" />
      </label>
      <label class="control">
        <span>Theme</span>
        <select v-model="theme">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </UiCard>

    <section>
      <h2>Colors</h2>
      <div class="swatches">
        <div v-for="name in swatches" :key="name" class="swatch">
          <span class="swatch__color" :style="{ background: `var(--color-${name})` }" />
          <code>{{ name }}</code>
        </div>
      </div>
    </section>

    <section>
      <h2>Typography</h2>
      <p
        v-for="size in fontSizes"
        :key="size"
        :style="{ fontSize: `var(--font-size-${size})`, fontWeight: 800 }"
      >
        {{ size }} — Сделай это сегодня / Do it today
      </p>
      <p class="muted">Regular body text, muted. Съешь же ещё этих мягких французских булок.</p>
    </section>

    <section>
      <h2>Buttons</h2>
      <div class="row">
        <UiButton>Primary</UiButton>
        <UiButton variant="secondary">Secondary</UiButton>
        <UiButton variant="danger">Danger</UiButton>
        <UiButton variant="ghost">Ghost</UiButton>
        <UiButton disabled>Disabled</UiButton>
      </div>
      <UiButton size="lg" block>Сделал! / Done!</UiButton>
    </section>

    <section>
      <h2>Form controls</h2>
      <UiCheckbox v-model="checked">Checkbox — {{ checked ? 'done' : 'pending' }}</UiCheckbox>
      <UiTextField v-model="text" label="Text field" placeholder="Placeholder" />
      <UiTextField v-model="text" label="With error" error="Something is wrong" />
      <UiSegmentedControl
        v-model="segment"
        label="Segmented"
        :options="[
          { value: 'a', label: 'Today' },
          { value: 'b', label: 'Habit' },
        ]"
      />
      <UiChipGroup
        v-model="chips"
        label="Chips"
        :options="[1, 2, 3, 4, 5].map((n) => ({ value: n, label: `#${n}` }))"
      />
      <div class="row">
        <UiIconButton label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
          </svg>
        </UiIconButton>
      </div>
    </section>

    <section>
      <h2>Cards</h2>
      <UiCard>
        <h3>Позвонить маме</h3>
        <p class="muted">Card with depth and border</p>
      </UiCard>
    </section>
  </div>
</template>

<style scoped>
.kit {
  display: grid;
  gap: var(--space-6);
}

section {
  display: grid;
  gap: var(--space-3);
}

.controls {
  position: sticky;
  top: var(--space-2);
  z-index: 1;
  display: grid;
  gap: var(--space-3);
}

.control {
  display: grid;
  gap: var(--space-1);
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--space-3);
}

.swatch {
  display: grid;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
}

.swatch__color {
  height: 48px;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-md);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.muted {
  color: var(--color-text-muted);
}
</style>
