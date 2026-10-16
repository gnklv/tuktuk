<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAppI18n } from '../i18n'
import { localDateToDate } from '../i18n/dates'
import { useTodayStore } from '../stores/today'
import { useSettingsStore } from '../stores/settings'
import { useRemindersStore } from '../stores/reminders'
import { UiIcon, UiIconButton } from '../ui'
import TaskItem from '../features/today/TaskItem.vue'
import AddTaskForm from '../features/today/AddTaskForm.vue'
import MoodMascot from '../features/today/MoodMascot.vue'
import DeadlineCard from '../features/today/DeadlineCard.vue'
import NotificationsBanner from '../features/reminders/NotificationsBanner.vue'
import StreakBadge from '../features/today/StreakBadge.vue'
import YesterdaySummary from '../features/today/YesterdaySummary.vue'
import { useYesterdaySummary } from '../features/today/use-yesterday-summary'

const { t, d } = useAppI18n()
const today = useTodayStore()
const settingsStore = useSettingsStore()
const reminders = useRemindersStore()
const { visible: showSummary, dismiss: dismissSummary } = useYesterdaySummary()
</script>

<template>
  <div class="today">
    <header class="today__header">
      <div class="today__title">
        <h1>{{ t('app.name') }} 🐦</h1>
        <StreakBadge v-if="today.streak" class="today__streak" :streak="today.streak.streak" />
        <UiIconButton :as="RouterLink" to="/settings" :label="t('settings.title')">
          <UiIcon name="settings" :size="22" />
        </UiIconButton>
      </div>
      <p class="muted">
        {{ t('today.date', { date: d(localDateToDate(today.shownDate), 'dayLong') }) }}
      </p>
    </header>

    <YesterdaySummary
      v-if="showSummary && today.streak"
      :overview="today.streak"
      @dismiss="dismissSummary"
    />

    <template v-if="today.overview">
      <MoodMascot :pressure="today.pressure" :total="today.total" :all-done="today.allDone" />
      <DeadlineCard
        v-if="today.total > 0 && !today.allDone"
        :pressure="today.pressure"
        :deadline="settingsStore.settings.dayDeadline"
        :done="today.done"
        :total="today.total"
        :next-nudge-at="reminders.permission === 'granted' ? reminders.nextAt : null"
      />
      <NotificationsBanner :has-pending="today.total > 0 && !today.allDone" />
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
  /* minmax(0, …): long content (inputs, titles) must not widen the page on narrow phones. */
  grid-template-columns: minmax(0, 1fr);
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
  padding: var(--space-3) 0 max(var(--space-4), env(safe-area-inset-bottom));
  background: linear-gradient(transparent, var(--color-bg) var(--space-3));
}

.today__streak {
  margin-left: auto;
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
