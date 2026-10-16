<script setup lang="ts">
import { computed } from 'vue'
import { LOCALES, type Locale } from '@tuktuk/core'
import { LOCALE_NAMES } from '@tuktuk/i18n'
import { UiSegmentedControl } from '../../ui'
import { useAppI18n } from '../../i18n'
import SettingsSection from './SettingsSection.vue'
import { useSettingsSection } from './use-settings-section'

const { t } = useAppI18n()
const { settings, save } = useSettingsSection()

const locale = computed({
  get: () => settings.value.locale,
  set: (value: Locale) => save({ locale: value }),
})
const options = LOCALES.map((code) => ({ value: code, label: LOCALE_NAMES[code] }))
</script>

<template>
  <SettingsSection :title="t('settings.language')">
    <UiSegmentedControl v-model="locale" :label="t('settings.language')" :options="options" />
  </SettingsSection>
</template>
