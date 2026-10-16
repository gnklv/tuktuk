<script setup lang="ts">
import { computed } from 'vue'
import { UiTimeField } from '../../ui'
import { useAppI18n } from '../../i18n'
import SettingsSection from './SettingsSection.vue'
import { deadlineFromInput, deadlineToInput } from './time-input'
import { useSettingsSection } from './use-settings-section'

const { t } = useAppI18n()
const { settings, save, error, revision } = useSettingsSection()

const deadline = computed({
  get: () => deadlineToInput(settings.value.dayDeadline),
  set: (value: string) => save({ dayDeadline: deadlineFromInput(value) }),
})
</script>

<template>
  <SettingsSection
    :title="t('settings.deadline.title')"
    :hint="t('settings.deadline.hint')"
    :error="error"
  >
    <UiTimeField
      :key="revision"
      v-model="deadline"
      class="deadline__field"
      :label="t('settings.deadline.label')"
    />
  </SettingsSection>
</template>

<style scoped>
.deadline__field {
  width: min(100%, 180px);
}
</style>
