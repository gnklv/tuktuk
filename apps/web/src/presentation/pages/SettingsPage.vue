<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { UiIcon, UiIconButton } from '../ui'
import { useAppI18n } from '../i18n'
import DeadlineSection from '../features/settings/DeadlineSection.vue'
import RemindersSection from '../features/settings/RemindersSection.vue'
import QuietHoursSection from '../features/settings/QuietHoursSection.vue'
import LanguageSection from '../features/settings/LanguageSection.vue'
import ThemeSection from '../features/settings/ThemeSection.vue'
import TimeZoneSection from '../features/settings/TimeZoneSection.vue'

const { t } = useAppI18n()
</script>

<template>
  <div class="settings">
    <header class="settings__header">
      <UiIconButton :as="RouterLink" to="/" :label="t('settings.back')">
        <UiIcon name="back" :size="22" />
      </UiIconButton>
      <h1>{{ t('settings.title') }}</h1>
    </header>

    <DeadlineSection />
    <RemindersSection />
    <QuietHoursSection />
    <LanguageSection />
    <ThemeSection />
    <TimeZoneSection />
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  /* minmax(0, …): long content must not widen the page on narrow phones. */
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

.settings__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: calc(-1 * var(--space-2));
}
</style>
