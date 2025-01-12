import type { ILoggerSettings } from 'src/settings/types'
import { db } from 'src/assets/storage'
import { logByName } from './logByName'
import { getData } from './data'
import { isItemMatched } from 'src/lib/match'
import type { App } from 'obsidian'
import { parseLog } from './parseLog'
import { getLogsFromDataByName } from './getLogsFromDataByName'

export const api = (
	app: App,
	settings: ILoggerSettings,
	regArr: (string | RegExp)[]
) => {
	return {
		getLogsFromDataByName: async (
			name: string,
			params: any
		) => getLogsFromDataByName(settings, name, params),
		parseLog: (log: string) =>
			parseLog(settings, regArr, log),
		logByName: async (
			params: {
				name: string
				data: Record<string, string>
			}[]
		) => {
			const dataWithBlocks = params.map((data) => {
				const block = settings.blocks.find(
					(b) => b.name === data.name
				)
				return {
					...data,
					sectionName:
						block?.sectionName ||
						settings.global.sectionName
				}
			})
			// @ts-ignore
			const grouped = Object.groupBy(
				dataWithBlocks,
				({ sectionName }) => sectionName
			)
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms))

			for (const entry of Object.entries(grouped)) {
				const [sectionName, data]: any = entry
				await logByName(app, settings, sectionName, data)
				await delay(500)
			}
		},
		getBy: async (data: any) => {
			const metaData = Object.fromEntries(
				Object.entries(data).filter(([key]) =>
					key.startsWith('meta.')
				)
			)
			return (
				await getData(settings.blocks, () => db.getBy(data))
			).filter((item) => isItemMatched(metaData, item))
		},
		pick: (item: any, data: any) => {
			const entries = Object.entries(data).map(
				([key, val]: any) => {
					const keys = val.split('.')
					let value: any = item

					while (value && keys.length) {
						const key = keys.shift()
						if (key) value = value[key]
					}

					if (value !== undefined) return [key, value]

					return [key, '']
				}
			)

			return Object.fromEntries(entries)
		}
	}
}
