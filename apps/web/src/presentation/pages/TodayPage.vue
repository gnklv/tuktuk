<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppI18n } from '../i18n'
import { useClock } from '../di'
import { useTodayStore } from '../stores/today'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'
import TaskItem from '../features/today/TaskItem.vue'
import AddTaskForm from '../features/today/AddTaskForm.vue'

const { t, d } = useAppI18n()
const now = useClock().now()
const today = useTodayStore()

onMounted(today.load)
</script>

<template>
  <div class="today">
    <header class="today__header">
      <h1>{{ t('app.name') }} 🐦</h1>
      <p class="muted">{{ t('today.date', { date: d(now, 'dayLong') }) }}</p>
      <p v-if="today.total > 0" class="today__progress">
        {{
          today.allDone
            ? t('today.allDone')
            : t('today.progress', { done: today.done, total: today.total })
        }}
      </p>
    </header>

    <ul v-if="today.overview?.items.length" class="today__list">
      <TaskItem
        v-for="item in today.overview.items"
        :key="item.task.id"
        :item="item"
        @toggle="today.toggle(item.task.id)"
      />
    </ul>
    <p v-else-if="today.overview" class="today__empty muted">{{ t('today.empty') }}</p>

    <div class="today__add">
      <AddTaskForm />
    </div>

    <footer class="today__footer">
      <LocaleSwitcher />
    </footer>
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

.today__progress {
  margin-top: var(--space-2);
  font-weight: var(--font-weight-bold);
  color: var(--color-accent-strong);
}

.today__list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.today__empty {
  padding: var(--space-6) 0;
  text-align: center;
}

/* Thumb zone: the add form sticks to the bottom on long lists. */
.today__add {
  position: sticky;
  bottom: 0;
  padding: var(--space-3) 0 var(--space-4);
  background: linear-gradient(transparent, var(--color-bg) var(--space-3));
}

.today__footer {
  display: flex;
  justify-content: center;
}

.muted {
  color: var(--color-text-muted);
}
</style>
