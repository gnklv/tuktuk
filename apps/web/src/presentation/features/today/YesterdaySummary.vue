<script setup lang="ts">
import { computed } from 'vue'
import type { StreakOverview } from '@tuktuk/core'
import { UiButton, UiCard } from '../../ui'
import { useAppI18n } from '../../i18n'

/** "How did yesterday go": shown once per day, until dismissed. */
const { overview } = defineProps<{ overview: StreakOverview }>()
const emit = defineEmits<{ dismiss: [] }>()
const { t, tn } = useAppI18n()

const success = computed(() => overview.yesterday.result === 'done')
const text = computed(() => {
  const { done, total } = overview.yesterday
  if (!success.value) return t('summary.missed', { done, total })
  // Today isn't done yet, so the current streak is exactly the streak earned through yesterday.
  const days = tn('streak.days', overview.streak.current - (overview.streak.todayDone ? 1 : 0))
  return t('summary.done', { days })
})
</script>

<template>
  <UiCard class="summary" :class="{ 'summary--success': success }">
    <p class="summary__title">{{ success ? '🎉' : '😔' }} {{ t('summary.title') }}</p>
    <p class="summary__text">{{ text }}</p>
    <p v-if="overview.streak.best > overview.streak.current" class="summary__best">
      {{ t('streak.best', { days: tn('streak.days', overview.streak.best) }) }}
    </p>
    <UiButton variant="secondary" @click="emit('dismiss')">{{ t('summary.ok') }}</UiButton>
  </UiCard>
</template>

<style scoped>
.summary {
  display: grid;
  gap: var(--space-2);
  justify-items: start;
}

.summary--success {
  border-color: var(--color-streak);
}

.summary__title {
  font-weight: var(--font-weight-black);
}

.summary__best {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
