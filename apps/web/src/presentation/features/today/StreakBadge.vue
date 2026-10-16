<script setup lang="ts">
import { computed } from 'vue'
import type { Streak } from '@tuktuk/core'
import { useAppI18n } from '../../i18n'

const { streak } = defineProps<{ streak: Streak }>()
const { t, tn } = useAppI18n()

const hint = computed(() => {
  const days = tn('streak.days', streak.current)
  if (streak.todayDone) return `${t('streak.todayDone')} ${t('streak.label', { days })}`
  if (streak.atRisk) return `${t('streak.label', { days })}. ${t('streak.atRisk')}`
  return t('streak.label', { days })
})
</script>

<template>
  <span
    class="streak"
    :class="{ 'streak--lit': streak.todayDone, 'streak--risk': streak.atRisk }"
    role="img"
    :aria-label="hint"
    :title="hint"
  >
    <span class="streak__flame" aria-hidden="true">🔥</span>
    <span class="streak__count" aria-hidden="true">{{ streak.current }}</span>
  </span>
</template>

<style scoped>
.streak {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: var(--space-1) var(--space-3);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  font-weight: var(--font-weight-black);
  color: var(--color-text-muted);
}

.streak__flame {
  /* Not lit yet today: a grey flame. */
  filter: grayscale(1);
  opacity: 0.6;
  transition:
    filter var(--duration-base),
    opacity var(--duration-base),
    transform var(--duration-base) var(--ease-spring);
}

.streak--lit {
  border-color: var(--color-streak);
  color: var(--color-streak);
}

.streak--lit .streak__flame {
  filter: none;
  opacity: 1;
  animation: pop 0.5s var(--ease-spring);
}

.streak--risk .streak__flame {
  animation: flicker 1.6s ease-in-out infinite;
}

@keyframes pop {
  50% {
    transform: scale(1.5);
  }
}

@keyframes flicker {
  50% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .streak__flame {
    animation: none !important;
  }
}
</style>
