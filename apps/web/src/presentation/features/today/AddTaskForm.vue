<script setup lang="ts">
import { ref } from 'vue'
import { TASK_TITLE_MAX_LENGTH } from '@tuktuk/core'
import { UiButton, UiTextField } from '../../ui'
import { useAppI18n } from '../../i18n'
import { errorMessageKey } from '../../i18n/errors'
import { useTodayStore } from '../../stores/today'

const { t } = useAppI18n()
const today = useTodayStore()

const title = ref('')
const error = ref<string | null>(null)
const pending = ref(false)

async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    await today.addTask(title.value)
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
    <UiTextField
      v-model="title"
      class="add-task__field"
      :label="t('addTask.label')"
      hide-label
      :placeholder="t('addTask.placeholder')"
      :maxlength="TASK_TITLE_MAX_LENGTH"
      :error="error"
      @update:model-value="error = null"
    />
    <UiButton type="submit" :disabled="pending">{{ t('addTask.submit') }}</UiButton>
  </form>
</template>

<style scoped>
.add-task {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.add-task__field {
  flex: 1;
}
</style>
