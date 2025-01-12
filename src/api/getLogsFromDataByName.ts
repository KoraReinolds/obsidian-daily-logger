import { generateTemplate } from 'src/entities'
import { getItemsForBlockId } from 'src/settings/model'
import type {
	ILoggerSettings,
	TBlock
} from 'src/settings/types'

export const getLogsFromDataByName = async (
	settings: ILoggerSettings,
	name: string,
	params: Record<string, string>[]
) => {
	const grouped = { [name]: params }

	const mappedTemplates = await Promise.all(
		Object.entries(grouped)
			.map(([name, data]) => {
				const dataArr = (data as any).map((d) => d.data)
				const block = settings.blocks.find(
					(b) => b.name === name
				)
				if (!block) return null
				return [block, dataArr]
			})
			.filter((item) => !!item)
			.map(async (params) => {
				const block: TBlock = params[0] as never as TBlock
				const dataArr = params[1]

				const items = getItemsForBlockId(settings, block.id)
				const template = await generateTemplate({
					items,
					wrapToGroup: true,
					delimiter: settings.global.delimiter
				})
				return [template, dataArr]
			})
	)

	const logs = mappedTemplates.reduce((res, cur) => {
		const template = cur[0] as string
		const dataArr = cur[1] as Record<string, string>[]

		const logs = dataArr.map((data) => {
			const log = template.replace(/{(\w+)}/g, (_, key) => {
				return key in data ? data[key] : `{${key}}`
			})

			console.log(template, data, log)
			return log
		})
		return res.concat(logs)
	}, [])

	return logs
}
