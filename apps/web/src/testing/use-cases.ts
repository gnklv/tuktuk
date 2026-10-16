// Test helper: the real use cases over in-memory dependencies. Never imported by production code.
import { fakeNudgeCopy } from '@tuktuk/core/testing'
import {
  InMemoryCompletionRepository,
  InMemoryNudgeLog,
  InMemorySettingsRepository,
  InMemoryTaskRepository,
  RecordingNotifier,
  fakeClock,
  sequentialIds,
} from '@tuktuk/core/testing'
import type { PendingTitles, ReminderSnapshot } from '@tuktuk/core'
import { createUseCases, type UseCaseDeps } from '../application/use-cases'
import type { PushAccess, PushStatus } from '../application/ports'

/** A push port that records snapshots; its status can be switched in a test. */
export class FakePush implements PushAccess {
  readonly snapshots: ReminderSnapshot[] = []
  constructor(public current: PushStatus = 'off') {}
  async status() {
    return this.current
  }
  async enable() {
    this.current = 'on'
  }
  async syncSnapshot(snapshot: ReminderSnapshot) {
    this.snapshots.push(snapshot)
  }
}

export function createTestUseCases(overrides: Partial<UseCaseDeps> = {}) {
  const savedTitles: PendingTitles[] = []
  const deps: UseCaseDeps = {
    clock: fakeClock('2026-10-14T09:00:00Z'),
    ids: sequentialIds(),
    environment: { locale: 'ru', timeZone: 'Europe/Moscow' },
    taskRepo: new InMemoryTaskRepository(),
    completionRepo: new InMemoryCompletionRepository(),
    settingsRepo: new InMemorySettingsRepository(),
    nudgeLog: new InMemoryNudgeLog(),
    notifier: new RecordingNotifier(),
    localTitles: {
      save: async (titles) => {
        savedTitles.push(titles)
      },
    },
    push: new FakePush(),
    copy: fakeNudgeCopy,
    random: () => 0,
    ...overrides,
  }
  return { useCases: createUseCases(deps), deps, savedTitles }
}
