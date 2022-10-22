import { closest, distance } from 'fastest-levenshtein'

import data from './data'
import { Locale, Macro } from './utils'

export { data }

export const nameToIdMap: Record<Locale, Record<string, number>> = (() => {
  const ret: Record<Locale, Record<string, number>> = { en: {}, de: {}, fr: {}, ja: {}, zh: {}, ko: {} }
  for (const locale in data) {
    for (const macro of data[locale as Locale]) {
      ret[locale as Locale][macro.Command] = macro.ID
      ret[locale as Locale][macro.ShortCommand] = macro.ID
      ret[locale as Locale][macro.Alias] = macro.ID
      ret[locale as Locale][macro.ShortAlias] = macro.ID
    }
  }
  return ret
})()

export function get(id: number, locale?: Locale): Macro | undefined {
  locale ??= 'en'
  const macros = data[locale]
  return macros.find((m) => m.ID === id)
}

export function search(query: string, locale?: Locale, _distance?: number): Macro | undefined {
  locale ??= 'en'
  const name = closest(query, Object.keys(nameToIdMap[locale]))
  if (typeof _distance !== 'undefined' && distance(name, query) > _distance) return undefined
  const id = nameToIdMap[locale][name]
  const macro = get(id, locale)
  return macro
}
