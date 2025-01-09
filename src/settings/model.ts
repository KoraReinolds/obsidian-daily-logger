import { itemData } from 'src/entities'
import {
	EItemType,
	type ILoggerSettings,
	type TItem
} from './types'

export const getLogByBlockName = async (
	blockName: string,
	settings: ILoggerSettings
) => {
	const block = settings.blocks.find(
		(block) => block.name === blockName
	)

	if (!block) return

	const log = await getLogFromBlock(
		settings,
		block.id,
		settings.global.delimiter
	)

	return log
}

export const getItemsForBlockId = (
	settings: ILoggerSettings,
	id: string
) => {
	const items = getItemsFromBlock(settings, id)

	return items
		.map((item) => {
			if (itemData[item.type as EItemType]) {
				return item
			} else {
				return getItemsForBlockId(settings, item.type)
			}
		})
		.map((res, i) => {
			return Array.isArray(res)
				? {
						...items[i],
						nested: res
					}
				: res
		})
}

export const getItemsFromBlock = (
	settings: ILoggerSettings,
	blockId?: string,
	deep?: boolean
): TItem[] => {
	const block = settings.blocks.find(
		(block) => block.id === blockId
	)

	if (!block) return []

	const items = block.order
		.map((id) => {
			return settings.items[id]
		})
		.filter((item) => !!item)
		.map((item) => {
			if (EItemType[item.type as EItemType]) {
				return [item]
			} else {
				return deep
					? getItemsFromBlock(settings, item.type)
					: [item]
			}
		})

	return items.flat()
}

export const getLogFromBlock = async (
	settings: ILoggerSettings,
	blockId: string,
	delimiter = ''
): Promise<string> => {
	const items = getItemsFromBlock(settings, blockId)

	const values = await Promise.all(
		items.map((item) => {
			const data =
				itemData[item.type as keyof typeof EItemType]
			if (data) {
				return data.toValue(item)
			} else {
				return getLogFromBlock(
					settings,
					item.type,
					item.delimiter
				)
			}
		})
	)

	return values.join(delimiter)
}
