<script setup lang="ts">
import { useAppI18n } from '../i18n'
import { useClock } from '../di'
import LocaleSwitcher from '../components/LocaleSwitcher.vue'

const { t, d } = useAppI18n()
const now = useClock().now()
</script>

<template>
  <header class="header">
    <h1>{{ t('app.name') }} 🐦</h1>
    <p class="date">{{ t('today.date', { date: d(now, 'dayLong') }) }}</p>
  </header>
  <LocaleSwitcher />
</template>

<style scoped>
.header {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-5);
}

.date {
  color: var(--color-text-muted);
}
</style>
