<script setup lang="ts">
import { computed } from 'vue'
import type { DayItem } from '@tuktuk/core'
import { UiCheckbox, UiIcon, UiIconButton } from '../../ui'
import { useAppI18n } from '../../i18n'
import { useScheduleLabel } from '../../i18n/weekdays'

const { item } = defineProps<{ item: DayItem }>()
const emit = defineEmits<{ toggle: []; remove: [] }>()

const { t } = useAppI18n()
const scheduleLabel = useScheduleLabel()

const done = computed({
  get: () => item.completedAt !== null,
  set: () => emit('toggle'),
})
const habit = computed(() => scheduleLabel(item.task.schedule))

function remove() {
  if (window.confirm(t('task.removeConfirm', { title: item.task.title }))) emit('remove')
}
</script>

<template>
  <li class="task-item" :class="{ 'task-item--done': done }">
    <UiCheckbox v-model="done" class="task-item__check">
      <span class="task-item__title">{{ item.task.title }}</span>
      <span v-if="habit" class="task-item__schedule">🔁 {{ habit }}</span>
    </UiCheckbox>
    <UiIconButton :label="t('task.remove')" @click="remove">
      <UiIcon name="close" :size="20" />
    </UiIconButton>
  </li>
</template>

<style scoped>
.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 var(--depth) 0 var(--color-border);
}

.task-item__check {
  flex: 1;
  min-width: 0;
}

.task-item__title {
  display: block;
  font-weight: var(--font-weight-bold);
  transition: color var(--duration-base);
}

.task-item__schedule {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.task-item--done .task-item__title {
  color: var(--color-text-muted);
  text-decoration: line-through;
}
</style>
