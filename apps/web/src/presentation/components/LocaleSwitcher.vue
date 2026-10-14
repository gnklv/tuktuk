<script setup lang="ts">
import { computed } from 'vue'
import { LOCALES, type Locale } from '@tuktuk/core'
import { LOCALE_NAMES, useAppI18n } from '../i18n'
import { useSettingsStore } from '../stores/settings'

const { t } = useAppI18n()
const settingsStore = useSettingsStore()

const locale = computed({
  get: () => settingsStore.settings.locale,
  set: (value: Locale) => settingsStore.update({ locale: value }),
})
</script>

<template>
  <label class="locale-switcher">
    {{ t('locale.label') }}
    <select v-model="locale">
      <option v-for="code in LOCALES" :key="code" :value="code">
        {{ LOCALE_NAMES[code] }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.locale-switcher {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
