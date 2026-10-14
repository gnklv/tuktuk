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
    submit: 'Добавить',
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
