<script setup lang="ts">
import { computed } from 'vue'
import { THEMES, type Theme } from '@tuktuk/core'
import { UiSegmentedControl } from '../../ui'
import { useAppI18n } from '../../i18n'
import SettingsSection from './SettingsSection.vue'
import { useSettingsSection } from './use-settings-section'

const { t } = useAppI18n()
const { settings, save } = useSettingsSection()

const theme = computed({
  get: () => settings.value.theme,
  set: (value: Theme) => save({ theme: value }),
})
const options = computed(() =>
  THEMES.map((value) => ({ value, label: t(`settings.theme.${value}`) })),
)
</script>

<template>
  <SettingsSection :title="t('settings.theme.title')">
    <UiSegmentedControl v-model="theme" :label="t('settings.theme.title')" :options="options" />
  </SettingsSection>
</template>
