import type { MessageSchema } from './en'

export const ru: MessageSchema = {
  app: {
    name: 'Тук-тук',
  },
  today: {
    date: 'Сегодня {date}',
    progress: 'Сделано {done} из {total}',
    empty: 'Пока ничего не запланировано. Что нужно сделать сегодня?',
    allDone: 'На сегодня всё! 🎉',
  },
  addTask: {
    label: 'Новое дело',
    placeholder: 'Что нужно сделать сегодня?',
    habitPlaceholder: 'Что хочешь делать регулярно?',
    submit: 'Добавить',
    kindLabel: 'Тип дела',
    kind: {
      once: 'Сегодня',
      habit: 'Привычка',
    },
    weekdaysLabel: 'Повторять по',
  },
  schedule: {
    everyDay: 'Каждый день',
    weekdays: 'По будням',
    weekends: 'По выходным',
  },
  task: {
    remove: 'Удалить дело',
    removeConfirm: 'Удалить «{title}»? Оно пропадёт начиная с сегодня, прошлые дни сохранятся.',
  },
  settings: {
    title: 'Настройки',
    back: 'Назад',
    deadline: {
      title: 'Дедлайн дня',
      hint: 'К этому времени всё на сегодня должно быть сделано. Чем ближе дедлайн, тем настойчивее напоминания.',
      label: 'Дедлайн',
    },
    quietHours: {
      title: 'Тихие часы',
      hint: 'В это время напоминаний не будет.',
      enabled: 'Включить тихие часы',
      from: 'С',
      to: 'До',
    },
    language: 'Язык',
    theme: {
      title: 'Тема',
      system: 'Системная',
      light: 'Светлая',
      dark: 'Тёмная',
    },
    timeZone: {
      title: 'Часовой пояс',
      differs: 'На устройстве сейчас {device}.',
      useDevice: 'Взять с устройства',
    },
  },
  errors: {
    unknown: 'Что-то пошло не так. Попробуй ещё раз.',
    settings: {
      deadlineAtDayStart: 'Дедлайн не может быть в самом начале дня.',
      deadlineInQuietHours: 'Дедлайн попадает в тихие часы — последние напоминания не придут.',
      quietHoursEmpty: 'Начало и конец тихих часов должны различаться.',
    },
    localDate: {
      invalid: 'Неверная дата.',
    },
    timeOfDay: {
      invalid: 'Неверное время.',
    },
    task: {
      titleEmpty: 'Дай делу название.',
      titleTooLong: 'Слишком длинное название.',
      noWeekdays: 'Выбери хотя бы один день недели.',
      invalidWeekday: 'Неверный день недели.',
      notFound: 'Этого дела больше нет.',
      notScheduled: 'Это дело не запланировано на этот день.',
    },
  },
}
