<script setup lang="ts">
import { UiCard } from '../../ui'

/** A card on the settings page: title, optional hint, content and an error, if any. */
defineProps<{ title: string; hint?: string; error?: string | null }>()
</script>

<template>
  <UiCard as="section" class="settings-section">
    <h2 class="settings-section__title">{{ title }}</h2>
    <p v-if="hint" class="ui-hint">{{ hint }}</p>
    <slot />
    <p v-if="error" class="ui-error" role="alert">{{ error }}</p>
  </UiCard>
</template>

<style scoped>
.settings-section {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.settings-section__title {
  font-size: var(--font-size-lg);
}
</style>
