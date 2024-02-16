import { writeFile } from 'fs/promises'
import * as path from 'path'

import { parseStream } from '@fast-csv/parse'
import axios, { AxiosInstance } from 'axios'

import { Fields, Macro, MacrosData, XivapiResponse } from '../src/utils'

export class Updater {
  axios: AxiosInstance
  constructor(axios: AxiosInstance) {
    this.axios = axios
  }

  async update(): Promise<void> {
    const macros = await this.fetchIntl()
    const cnMacros = await this.fetchCn()
    const koMacros = await this.fetchKo()

    const allMacros: MacrosData = Object.assign(macros, cnMacros, koMacros)

    const dataFile = path.resolve(__dirname, '../data/macro.json')

    await writeFile(dataFile, JSON.stringify(allMacros), 'utf8')
  }

  async fetchXivapi<T>(url: string, columns: string[]): Promise<T[]> {
    const ret: T[] = []
    let { data } = await this.axios.get<XivapiResponse<T>>(url, {
      params: { columns: columns.join(',') },
    })
    ret.push(...data.Results)
    while (data && data.Pagination.PageNext) {
      data = (
        await this.axios.get<XivapiResponse<T>>(url, {
          params: { columns: columns.join(','), page: data.Pagination.PageNext },
        })
      ).data
      ret.push(...data.Results)
    }
    return ret
  }

  async fetchIntl(): Promise<Record<'en' | 'de' | 'fr' | 'ja', Array<Macro>>> {
    type IntlMacros = { ID: number } & Record<`${Fields}_${'en' | 'de' | 'fr' | 'ja'}`, string>
    const locales = ['en', 'de', 'fr', 'ja'] as const
    const data = await this.fetchXivapi<IntlMacros>(
      'https://xivapi.com/TextCommand',
      ['ID'].concat(
        locales.reduce<string[]>((arr, loc) => {
          arr.push(`Command_${loc}`, `ShortCommand_${loc}`, `Alias_${loc}`, `ShortAlias_${loc}`, `Description_${loc}`)
          return arr
        }, []),
      ),
    )
    const ret: Record<'en' | 'de' | 'fr' | 'ja', Array<Macro>> = { en: [], de: [], fr: [], ja: [] }
    for (const macro of data) {
      locales.forEach((loc) => {
        ret[loc].push({
          ID: macro.ID,
          Command: macro[`Command_${loc}`],
          ShortCommand: macro[`ShortCommand_${loc}`],
          Alias: macro[`Alias_${loc}`],
          ShortAlias: macro[`ShortAlias_${loc}`],
          Description: macro[`Description_${loc}`],
        })
      })
    }

    return ret
  }

  async fetchCn(): Promise<Record<'zh', Array<Macro>>> {
    const data = await this.fetchXivapi<{ ID: number } & Record<`${Fields}_chs`, string>>(
      'https://cafemaker.wakingsands.com/TextCommand',
      ['ID', 'Command_chs', 'ShortCommand_chs', 'Alias_chs', 'ShortAlias_chs', 'Description_chs'],
    )
    return {
      zh: data.map((macro) => ({
        ID: macro.ID,
        Command: macro.Command_chs,
        ShortCommand: macro.ShortCommand_chs,
        Alias: macro.Alias_chs,
        ShortAlias: macro.ShortAlias_chs,
        Description: macro.Description_chs,
      })),
    }
  }

  async fetchKo(): Promise<Record<'ko', Array<Macro>>> {
    const { data: content } = await this.axios.get<NodeJS.ReadableStream>(
      'https://cdn.jsdelivr.net/gh/Ra-Workspace/ffxiv-datamining-ko@master/csv/TextCommand.csv',
      {
        responseType: 'stream',
      },
    )

    const rows = await new Promise<Macro[]>((resolve, reject) => {
      const rows: Macro[] = []
      parseStream(content, {
        skipLines: 1,
        ignoreEmpty: false,
        headers: true,
      })
        .on('error', (err) => reject(err))
        .on('data', (row) => {
          // CSV files from SaintCoinach has the first 3 rows as headers,
          // but only the second row is useful for naming.
          // the third row is type information, which we don't need.
          // `#` column is the ID, which is always number.
          if (/^[0-9]+$/.test(row?.['#'])) {
            rows.push({
              ID: Number(row?.['#']),
              Alias: row.Alias,
              Command: row.Command,
              Description: row.Description,
              ShortAlias: row.ShortAlias,
              ShortCommand: row.ShortCommand,
            })
          }
        })
        .on('end', (rowCount: number) => {
          if (rowCount === 0) reject(new Error('csv reads no data'))

          resolve(rows)
        })
    })

    return { ko: rows }
  }
}

;(async () => {
  new Updater(axios.create()).update()
})()
