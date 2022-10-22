export type XivapiResponse<T = unknown> = {
  Pagination: {
    Page: number
    PageNext: number | null
    PagePrev: number | null
    PageTotal: number
    Results: number
    ResultsPerPage: number
    ResultsTotal: number
  }
  Results: T[]
}

export type Fields = 'Command' | 'ShortCommand' | 'Alias' | 'ShortAlias' | 'Description'

export type Locale = 'en' | 'ja' | 'de' | 'fr' | 'zh' | 'ko'
export type Macro = { ID: number } & Record<Fields, string>
export type MacrosData = Record<Locale, Array<Macro>>
