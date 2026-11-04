import type { PlatformPage } from './platformApi'

export function assertPlatformPage<T>(value: PlatformPage<T>): PlatformPage<T> {
  if (
    !value ||
    !Array.isArray(value.items) ||
    !value.meta ||
    !Number.isInteger(value.meta.page) ||
    value.meta.page < 1 ||
    !Number.isInteger(value.meta.limit) ||
    value.meta.limit < 1 ||
    !Number.isInteger(value.meta.total) ||
    value.meta.total < 0 ||
    !Number.isInteger(value.meta.pages) ||
    value.meta.pages < 0
  ) {
    throw new Error('The server returned an invalid list response. Refresh the page or contact support.')
  }
  return value
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid date'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function displayIndustry(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
