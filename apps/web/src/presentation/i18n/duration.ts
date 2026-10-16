import { useAppI18n } from '.'

/** `3 ч 20 мин`, `45 мин`, `2 ч`. */
export function useFormatDuration() {
  const { t } = useAppI18n()
  return (minutes: number): string => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    if (h === 0) return t('duration.minutes', { m })
    if (m === 0) return t('duration.hours', { h })
    return t('duration.hoursMinutes', { h, m })
  }
}
