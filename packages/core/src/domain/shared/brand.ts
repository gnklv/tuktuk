/** Nominal typing: a `TaskId` can't be passed where a plain string or another id is expected. */
export type Brand<T, B extends string> = T & { readonly __brand: B }
