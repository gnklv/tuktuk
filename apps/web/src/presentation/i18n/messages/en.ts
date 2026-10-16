export const en = {
  app: {
    name: 'Tuk-Tuk',
  },
  today: {
    date: 'Today is {date}',
    progress: '{done} of {total} done',
  },
  mascot: {
    empty: 'Nothing planned yet. Add something — I’ll keep an eye on it.',
    allDone: 'All done for today! Go and rest, you’ve earned it.',
    calm: 'A fine day to get everything done.',
    nudging: 'Knock-knock. Maybe start with something small?',
    insistent: 'Tasks won’t do themselves, you know.',
    annoyed: 'I’m starting to get nervous. Seriously.',
    panic: 'THE DEADLINE IS COMING! DO IT NOW!',
    overdue: 'The deadline has passed… Finish it anyway, it still counts.',
  },
  deadline: {
    left: '{time} to the deadline',
    overdue: 'Deadline passed',
    at: 'due {time}',
    progressLabel: 'Day progress towards the deadline',
  },
  duration: {
    minutes: '{m} min',
    hours: '{h} h',
    hoursMinutes: '{h} h {m} min',
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
