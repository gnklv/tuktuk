<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppI18n } from '../i18n'
import { localDateToDate } from '../i18n/dates'
import { useTodayStore } from '../stores/today'
import { useSettingsStore } from '../stores/settings'
import { useClockTick } from '../composables/use-clock-tick'
import { UiIconButton } from '../ui'
import TaskItem from '../features/today/TaskItem.vue'
import AddTaskForm from '../features/today/AddTaskForm.vue'
import MoodMascot from '../features/today/MoodMascot.vue'
import DeadlineCard from '../features/today/DeadlineCard.vue'

const { t, d } = useAppI18n()
const today = useTodayStore()
const settingsStore = useSettingsStore()

onMounted(today.load)
useClockTick(today.tick)
</script>

<template>
  <div class="today">
    <header class="today__header">
      <div class="today__title">
        <h1>{{ t('app.name') }} 🐦</h1>
        <UiIconButton :as="RouterLink" to="/settings" :label="t('settings.title')">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
            />
          </svg>
        </UiIconButton>
      </div>
      <p class="muted">
        {{ t('today.date', { date: d(localDateToDate(today.date), 'dayLong') }) }}
      </p>
    </header>

    <template v-if="today.overview">
      <MoodMascot :pressure="today.pressure" :total="today.total" :all-done="today.allDone" />
      <DeadlineCard
        v-if="today.total > 0 && !today.allDone"
        :pressure="today.pressure"
        :deadline="settingsStore.settings.dayDeadline"
        :done="today.done"
        :total="today.total"
      />
    </template>

    <ul v-if="today.overview?.items.length" class="today__list">
      <TaskItem
        v-for="item in today.overview.items"
        :key="item.task.id"
        :item="item"
        @toggle="today.toggle(item.task.id)"
        @remove="today.archive(item.task.id)"
      />
    </ul>

    <div class="today__add">
      <AddTaskForm />
    </div>
  </div>
</template>

<style scoped>
.today {
  display: grid;
  gap: var(--space-5);
}

.today__header {
  display: grid;
  gap: var(--space-1);
}

.today__list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Thumb zone: the add form sticks to the bottom on long lists. */
.today__add {
  position: sticky;
  bottom: 0;
  padding: var(--space-3) 0 var(--space-4);
  background: linear-gradient(transparent, var(--color-bg) var(--space-3));
}

.today__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-right: calc(-1 * var(--space-2));
}

.muted {
  color: var(--color-text-muted);
}
</style>
