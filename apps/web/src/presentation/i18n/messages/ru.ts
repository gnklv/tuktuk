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
  locale: {
    label: 'Язык',
  },
  errors: {
    unknown: 'Что-то пошло не так. Попробуй ещё раз.',
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
