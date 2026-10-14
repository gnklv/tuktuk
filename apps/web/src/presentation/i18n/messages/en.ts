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
    submit: 'Add',
  },
  locale: {
    label: 'Language',
  },
  errors: {
    unknown: 'Something went wrong. Please try again.',
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
