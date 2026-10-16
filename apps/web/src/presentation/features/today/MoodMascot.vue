<script setup lang="ts">
import { computed } from 'vue'
import type { DayPressure, PressureLevel } from '@tuktuk/core'
import { useAppI18n } from '../../i18n'

/** Placeholder mascot until the woodpecker is drawn: an emoji and a line for every mood. */
const { pressure, total, allDone } = defineProps<{
  pressure: DayPressure
  total: number
  allDone: boolean
}>()

type Mood = PressureLevel | 'empty' | 'allDone' | 'overdue'

const EMOJI: Record<Mood, string> = {
  empty: '🐦',
  allDone: '🥳',
  calm: '😊',
  nudging: '🙂',
  insistent: '😐',
  annoyed: '😠',
  panic: '😱',
  overdue: '😵',
}

const { t } = useAppI18n()

const mood = computed<Mood>(() => {
  if (total === 0) return 'empty'
  if (allDone) return 'allDone'
  if (pressure.overdue) return 'overdue'
  return pressure.level
})
</script>

<template>
  <div class="mascot" :class="`mascot--${mood}`">
    <span class="mascot__face" aria-hidden="true">{{ EMOJI[mood] }}</span>
    <p class="mascot__bubble" aria-live="polite">{{ t(`mascot.${mood}`) }}</p>
  </div>
</template>

<style scoped>
.mascot {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mascot__face {
  flex: none;
  font-size: 56px;
  line-height: 1;
  animation: bob 3s ease-in-out infinite;
}

.mascot__bubble {
  position: relative;
  padding: var(--space-3) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  font-weight: var(--font-weight-bold);
}

/* Bubble tail pointing at the face. */
.mascot__bubble::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -8px;
  width: 12px;
  height: 12px;
  border-bottom: var(--border-width) solid var(--color-border);
  border-left: var(--border-width) solid var(--color-border);
  background: var(--color-surface);
  transform: translateY(-50%) rotate(45deg);
}

.mascot--annoyed .mascot__face {
  animation: shake 0.8s ease-in-out infinite;
}

.mascot--panic .mascot__face,
.mascot--overdue .mascot__face {
  animation: shake 0.35s ease-in-out infinite;
}

.mascot--allDone .mascot__face {
  animation: bounce 1s var(--ease-spring) infinite;
}

@keyframes bob {
  50% {
    transform: translateY(-4px);
  }
}

@keyframes shake {
  25% {
    transform: translateX(-3px) rotate(-6deg);
  }
  75% {
    transform: translateX(3px) rotate(6deg);
  }
}

@keyframes bounce {
  50% {
    transform: translateY(-10px) scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascot__face {
    animation: none !important;
  }
}
</style>
