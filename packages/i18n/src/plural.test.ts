import { describe, expect, it } from 'vitest'
import { russianPlural } from './plural'

const forms = ['день', 'дня', 'дней'] as const
const word = (n: number) => `${n} ${forms[russianPlural(n)]}`

describe('russianPlural', () => {
  it.each([
    [0, '0 дней'],
    [1, '1 день'],
    [2, '2 дня'],
    [4, '4 дня'],
    [5, '5 дней'],
    [11, '11 дней'],
    [12, '12 дней'],
    [14, '14 дней'],
    [21, '21 день'],
    [22, '22 дня'],
    [25, '25 дней'],
    [101, '101 день'],
    [111, '111 дней'],
    [112, '112 дней'],
    [122, '122 дня'],
  ])('%d → %s', (n, expected) => {
    expect(word(n)).toBe(expected)
  })
})
