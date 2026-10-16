<script setup lang="ts">
import { computed } from 'vue'
import { formatTimeOfDay, type DayPressure, type TimeOfDay } from '@tuktuk/core'
import { UiCard, UiProgress } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useFormatDuration } from '../../i18n/duration'

const { pressure, deadline, done, total, nextNudgeAt } = defineProps<{
  pressure: DayPressure
  deadline: TimeOfDay
  done: number
  total: number
  /** Shown only when reminders can actually be delivered. */
  nextNudgeAt: Date | null
}>()

const { t, d } = useAppI18n()
const formatDuration = useFormatDuration()

const headline = computed(() =>
  pressure.overdue
    ? t('deadline.overdue')
    : t('deadline.left', { time: formatDuration(pressure.minutesLeft) }),
)
</script>

<template>
  <UiCard class="deadline" :class="{ 'deadline--overdue': pressure.overdue }">
    <div class="deadline__row">
      <p class="deadline__headline">{{ headline }}</p>
      <p class="deadline__at">{{ t('deadline.at', { time: formatTimeOfDay(deadline) }) }}</p>
    </div>
    <UiProgress :value="pressure.elapsed" :label="t('deadline.progressLabel')" />
    <div class="deadline__row">
      <p class="deadline__tasks">{{ t('today.progress', { done, total }) }}</p>
      <p v-if="nextNudgeAt" class="deadline__tasks">
        🔔 {{ t('reminders.next', { time: d(nextNudgeAt, 'time') }) }}
      </p>
    </div>
  </UiCard>
</template>

<style scoped>
.deadline {
  display: grid;
  gap: var(--space-3);
}

.deadline__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
}

.deadline__headline {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-black);
  color: var(--color-accent-strong);
  transition: color var(--duration-slow);
}

.deadline--overdue .deadline__headline {
  color: var(--color-danger);
}

.deadline__at,
.deadline__tasks {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
