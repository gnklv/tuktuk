/** Recursively widens string literals to `string`, keeping tuple lengths. */
type DeepStringify<T> = T extends string ? string : { [K in keyof T]: DeepStringify<T[K]> }

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
  reminders: {
    title: 'Reminders',
    banner: {
      title: 'Let me remind you',
      text: 'Allow notifications and I’ll nudge you about unfinished tasks — gently in the morning, relentlessly towards the deadline.',
    },
    enable: 'Enable reminders',
    granted:
      'Reminders are on. Keep this tab open — reminders with the app closed are coming soon.',
    denied:
      'Notifications are blocked. Allow them for this site in your browser settings to get reminders.',
    unsupported: 'This browser can’t show notifications.',
    install: {
      title: 'Add the app to your Home Screen',
      text: 'On iPhone, reminders only work for apps on the Home Screen. Tap Share at the bottom of Safari, then “Add to Home Screen”, and open Tuk-Tuk from there.',
    },
    next: 'next reminder at {time}',
    push: {
      title: 'Push notifications',
      on: 'On: the server can notify you even when the app is closed.',
      off: 'Off.',
      unsupported: 'Not available here. On iPhone, open Tuk-Tuk from the Home Screen.',
      enable: 'Enable push notifications',
      test: 'Send a push in {seconds} s',
      testSent: 'Close the app or lock your phone — the push arrives in {seconds} s.',
      error: 'That didn’t work. Check your connection and try again.',
      testTitle: '🐦 Knock-knock from the server',
      testBody: 'Push works! Now I can remind you even when the app is closed.',
    },
    test: {
      button: 'Send a test reminder',
      title: '🐦 Knock-knock',
      body: 'This is what reminders look like. The closer the deadline, the louder I knock.',
    },
  },
  streak: {
    days: '{n} day | {n} days',
    label: 'Streak: {days}',
    atRisk: 'It’s on the line — finish today’s tasks.',
    todayDone: 'Today counts!',
    best: 'Best: {days}',
  },
  summary: {
    title: 'Yesterday',
    done: 'Everything done! Streak: {days} 🔥',
    missed: '{done} of {total} done. Today we start a new streak 💪',
    ok: 'Got it',
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
    placeholder: 'What to do today?',
    habitPlaceholder: 'What to do regularly?',
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
  nudge: {
    titles: {
      calm: '😊 Knock-knock',
      nudging: '🙂 Knock-knock',
      insistent: '😐 Knock-knock-knock',
      annoyed: '😠 KNOCK-KNOCK',
      panic: '😱 KNOCK! KNOCK! KNOCK!',
      overdue: '😵 Deadline passed',
    },
    variants: {
      calm: [
        'Good morning! On the list today: “{task}”. Plenty of time — {time} to the deadline.',
        'A fine day to get “{task}” done early and forget about it.',
        'Just a heads-up: “{task}”. No rush, but no “later” either.',
        'Do “{task}” in the morning and your evening is free.',
      ],
      nudging: [
        'Maybe now is the time for “{task}”?',
        '“{task}” is still waiting. Start with the first five minutes.',
        'Knock-knock. “{task}” won’t do itself.',
        '{time} to the deadline. How about “{task}”?',
        'A tiny step towards “{task}” is already a win.',
      ],
      insistent: [
        'I’m still here. And so is “{task}”.',
        '{time} to the deadline and “{task}” isn’t done. Coincidence? I think not.',
        'Seriously, “{task}”. Now.',
        'You remember “{task}”, right? I do.',
        'Half the day is gone. “{task}” isn’t.',
      ],
      annoyed: [
        '“{task}”! How long are you going to put it off?',
        '{time} to the deadline and “{task}” is still not done. I’m getting nervous.',
        'I’ll keep knocking until you do “{task}”. Knock. Knock. Knock.',
        'Let’s be honest: “{task}” will take less time than you think.',
        'Stop scrolling. “{task}” is waiting.',
      ],
      panic: [
        '{time} TO THE DEADLINE! “{task}” — RIGHT NOW!',
        'KNOCK-KNOCK-KNOCK! “{task}”! TIME IS ALMOST UP!',
        'Last chance to do “{task}” on time. {time}!',
        'I won’t let go. “{task}”. NOW.',
        'Your streak is in danger! “{task}”, {time} left!',
      ],
      overdue: [
        'The deadline has passed, but “{task}” can still be done. Go!',
        'Late isn’t never. “{task}”.',
        'Still knocking. “{task}” hasn’t gone anywhere.',
        'Do “{task}” before bed — tomorrow you’ll thank yourself.',
      ],
    },
  },
} as const

/** Every locale must have exactly this shape (including the number of reminder variants). */
export type MessageSchema = DeepStringify<typeof en>
