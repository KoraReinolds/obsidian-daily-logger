import { App, TFile } from 'obsidian'
import { generateTemplate } from 'src/entities'
import { FileContent } from 'src/entities/file'
import { getItemsForBlockId } from 'src/settings/model'
import type {
	ILoggerSettings,
	TBlock
} from 'src/settings/types'

export const logByName = async (
	app: App,
	settings: ILoggerSettings,
	sectionName: string,
	params: {
		name: string
		data: Record<string, string>
	}[]
) => {
	// @ts-ignore
	const grouped = Object.groupBy(
		params,
		(item: any) => item.name
	)

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

	const folderPath = 'Journal/Daily'
	const dateFormat = 'YYYY-MM-DD'
	// @ts-ignore
	const todayDate = moment().format(dateFormat)
	const filePath = `${folderPath}/${todayDate}.md`
	const file = app.vault.getAbstractFileByPath(filePath)

	if (file instanceof TFile) {
		const fileContent = await new FileContent(
			app,
			file
		).init()

		const endLoc =
			fileContent.getEndOfSectionByName(sectionName)

		if (!endLoc) return

		const content = fileContent._content
		const lines = content.split('\n')
		lines.splice(endLoc.line, 0, logs.join('\n'))
		const updatedContent = lines.join('\n')
		await app.vault.modify(file, updatedContent)
	}
}
