/** Source of current time. Core never calls `new Date()` directly. */
export interface Clock {
  now(): Date
}
