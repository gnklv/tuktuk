<script setup lang="ts">
import { useClock } from './di'

const today = useClock()
  .now()
  .toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
</script>

<template>
  <main>
    <h1>Тук-тук 🐦</h1>
    <p>Сегодня {{ today }}</p>
  </main>
</template>
