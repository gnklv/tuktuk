<script setup lang="ts">
import { computed } from 'vue'
import type { DayItem } from '@tuktuk/core'
import { UiCheckbox } from '../../ui'

const { item } = defineProps<{ item: DayItem }>()
const emit = defineEmits<{ toggle: [] }>()

const done = computed({
  get: () => item.completedAt !== null,
  set: () => emit('toggle'),
})
</script>

<template>
  <li class="task-item" :class="{ 'task-item--done': done }">
    <UiCheckbox v-model="done">
      <span class="task-item__title">{{ item.task.title }}</span>
    </UiCheckbox>
  </li>
</template>

<style scoped>
.task-item {
  padding: var(--space-2) var(--space-4);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: 0 var(--depth) 0 var(--color-border);
  transition: opacity var(--duration-base);
}

.task-item__title {
  font-weight: var(--font-weight-bold);
  transition: color var(--duration-base);
}

.task-item--done .task-item__title {
  color: var(--color-text-muted);
  text-decoration: line-through;
}
</style>
