export const en = {
  app: {
    name: 'Tuk-Tuk',
  },
  today: {
    date: 'Today is {date}',
    progress: '{done} of {total} done',
    empty: 'Nothing planned yet. What needs doing today?',
    allDone: 'All done for today! 🎉',
  },
  addTask: {
    label: 'New task',
    placeholder: 'What needs doing today?',
    habitPlaceholder: 'What do you want to do regularly?',
    submit: 'Add',
    kindLabel: 'Task type',
    kind: {
      once: 'Today',
      habit: 'Habit',
    },
    weekdaysLabel: 'Repeat on',
  },
  schedule: {
    everyDay: 'Every day',
    weekdays: 'Weekdays',
    weekends: 'Weekends',
  },
  task: {
    remove: 'Remove task',
    removeConfirm: 'Remove “{title}”? It disappears from today on; past days are kept.',
  },
  settings: {
    title: 'Settings',
    back: 'Back',
    deadline: {
      title: 'Day deadline',
      hint: 'By this time everything for the day should be done. Reminders grow more insistent as it gets closer.',
      label: 'Deadline',
    },
    quietHours: {
      title: 'Quiet hours',
      hint: 'No reminders during this time.',
      enabled: 'Enable quiet hours',
      from: 'From',
      to: 'To',
    },
    language: 'Language',
    theme: {
      title: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    timeZone: {
      title: 'Time zone',
      differs: 'Your device is in {device}.',
      useDevice: 'Use device time zone',
    },
  },
  errors: {
    unknown: 'Something went wrong. Please try again.',
    settings: {
      deadlineAtDayStart: 'The deadline can’t be at the very start of the day.',
      deadlineInQuietHours:
        'The deadline falls into quiet hours, so the last reminders would be muted.',
      quietHoursEmpty: 'Quiet hours must start and end at different times.',
    },
    localDate: {
      invalid: 'Invalid date.',
    },
    timeOfDay: {
      invalid: 'Invalid time.',
    },
    task: {
      titleEmpty: 'Give the task a name.',
      titleTooLong: 'That name is too long.',
      noWeekdays: 'Pick at least one day of the week.',
      invalidWeekday: 'Invalid day of the week.',
      notFound: 'This task no longer exists.',
      notScheduled: 'This task is not planned for this day.',
    },
  },
}

export type MessageSchema = typeof en
