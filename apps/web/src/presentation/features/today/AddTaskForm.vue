<script setup lang="ts">
import { computed, ref } from 'vue'
import { TASK_TITLE_MAX_LENGTH, type TaskSchedule, type Weekday } from '@tuktuk/core'
import { UiButton, UiChipGroup, UiSegmentedControl, UiTextField } from '../../ui'
import { useAppI18n } from '../../i18n'
import { errorMessageKey } from '../../i18n/errors'
import { WEEKDAYS, weekdayName } from '../../i18n/weekdays'
import { useTodayStore } from '../../stores/today'

type Kind = TaskSchedule['kind']

const { t, locale } = useAppI18n()
const today = useTodayStore()

const kind = ref<Kind>('once')
const weekdays = ref<Weekday[]>([...WEEKDAYS])
const title = ref('')
const error = ref<string | null>(null)
const pending = ref(false)

const kindOptions = computed(() => [
  { value: 'once' as const, label: t('addTask.kind.once') },
  { value: 'weekly' as const, label: t('addTask.kind.habit') },
])
const weekdayOptions = computed(() =>
  WEEKDAYS.map((d) => ({ value: d, label: weekdayName(d, locale.value) })),
)

const schedule = (): TaskSchedule =>
  kind.value === 'once'
    ? { kind: 'once', date: today.today() }
    : { kind: 'weekly', weekdays: weekdays.value }

async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    await today.addTask({ title: title.value, schedule: schedule() })
    title.value = ''
    error.value = null
  } catch (e) {
    error.value = t(errorMessageKey(e))
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="add-task" @submit.prevent="submit">
    <UiSegmentedControl v-model="kind" :label="t('addTask.kindLabel')" :options="kindOptions" />
    <UiChipGroup
      v-if="kind === 'weekly'"
      v-model="weekdays"
      :label="t('addTask.weekdaysLabel')"
      :options="weekdayOptions"
      @update:model-value="error = null"
    />
    <div class="add-task__row">
      <UiTextField
        v-model="title"
        class="add-task__field"
        :label="t('addTask.label')"
        hide-label
        :placeholder="kind === 'once' ? t('addTask.placeholder') : t('addTask.habitPlaceholder')"
        :maxlength="TASK_TITLE_MAX_LENGTH"
        :error="error"
        @update:model-value="error = null"
      />
      <UiButton type="submit" :disabled="pending">{{ t('addTask.submit') }}</UiButton>
    </div>
  </form>
</template>

<style scoped>
.add-task {
  display: grid;
  gap: var(--space-3);
  justify-items: start;
}

.add-task__row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  width: 100%;
}

.add-task__field {
  flex: 1;
}
</style>
