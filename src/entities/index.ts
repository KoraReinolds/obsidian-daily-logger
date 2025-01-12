import type { TItemData } from 'src/entities/types'
import { FindOrCreateNoteModal } from 'src/lib/modal'
import { escapeRegex } from 'src/lib/string'
import { getItemsForBlockId } from 'src/settings/model'
import {
	EItemType,
	type TItem,
	type ILoggerSettings,
	type TBlock,
	ELoggerType
} from 'src/settings/types'

enum EMoment {
	YYYY = 'YYYY',
	MM = 'MM',
	DD = 'DD',
	HH = 'HH',
	mm = 'mm'
}
export const getValueFromBlock = (
	settings: ILoggerSettings,
	block: TBlock
) => {
	const items = getItemsForBlockId(settings, block.id)

	const reg = generateDynamicRegExp({
		items,
		deep: false,
		wrapToGroup: true,
		delimiter: settings.global.delimiter
	})
	console.log(reg)

	return block.order
		.map((id) => settings.items[id])
		.filter((item) => !!item)
		.map((item) => getValueFromItem(settings, item))
		.join(settings.global.delimiter)
}

export const getValueFromItem = (
	settings: ILoggerSettings,
	item: TItem
): string => {
	switch (item.type) {
		case EItemType.text:
		case EItemType.hours:
		case EItemType.minutes:
		case EItemType.link: {
			if (item.anyText) return '...'
			return item.value
		}
		default: {
			const block = settings.blocks.find(
				(block) => block.id === item.type
			)

			if (!block) return ''

			return block.order
				.map((id) => settings.items[id])
				.map((item) => getValueFromItem(settings, item))
				.join(item.delimiter)
		}
	}
}

export const momentPatternToRegex = (pattern: EMoment) => {
	const replacements: Record<EMoment, string> = {
		YYYY: `\\d{4}`,
		MM: `0[1-9]|1[0-2]`,
		DD: `0[1-9]|[12]\\d|3[01]`,
		HH: `\\d+`,
		mm: `\\d+`
	}

	return replacements[pattern]
}

export const itemData: Record<EItemType, TItemData> = {
	[EItemType.link]: {
		toValue: async (item) => {
			return await new FindOrCreateNoteModal(
				// @ts-ignore
				app,
				item.value
			).open()
		},
		defaultValue: '',
		toRegexpr: () => `\\[\\[[^\\]]+\\]\\]`,
		isDisabled: false
	},
	[EItemType.text]: {
		toValue: async (item) => item.value,
		defaultValue: '',
		toRegexpr: (item) => {
			if (item.anyText) return `.+?`
			return escapeRegex(item.value)
		},
		isDisabled: false
	},
	[EItemType.hours]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		defaultValue: 'HH',
		toRegexpr: (item) =>
			momentPatternToRegex(item.value as EMoment),
		isDisabled: true
	},
	[EItemType.minutes]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		defaultValue: 'mm',
		toRegexpr: (item) =>
			momentPatternToRegex(item.value as EMoment),
		isDisabled: true
	}
}

export const generateTemplate = async (params: {
	items: TItem[]
	wrapToGroup: boolean
	delimiter: string
}): Promise<string> => {
	const { items, wrapToGroup, delimiter } = params

	const combinedPatternParts = await Promise.all(
		items.map((item) => {
			if (item.nested?.length) {
				return generateTemplate({
					items: item.nested,
					wrapToGroup: !!item.name,
					delimiter: item.delimiter
				})
			}

			if (item.name) {
				return wrapToGroup ? `{${item.name}}` : item.value
			}

			if (item.type === EItemType.text) {
				return item.value
			}

			return ''
		})
	)

	return combinedPatternParts.join(delimiter)
}

export const generateDynamicRegExp = (params: {
	items: TItem[]
	deep: boolean
	wrapToGroup: boolean
	delimiter: string
}): RegExp | string => {
	const { items, deep, wrapToGroup, delimiter } = params

	const combinedPatternParts = items
		.map((item) => {
			if (item.nested?.length) {
				return generateDynamicRegExp({
					items: item.nested,
					deep: true,
					wrapToGroup: !!item.name,
					delimiter: item.delimiter
				})
			}
			const data = itemData[item.type as EItemType]
			if (!data) {
				throw new Error(`Unknown type: ${item.type}`)
			}

			return data.toRegexpr(item)
		})
		.filter((str) => !!str)
		.map((str, i) => {
			const opt = items[i].isOptional ? '?' : ''

			const hasName = items[i].name
			const hasNestedItems = items[i].nested?.length
			const prefix = hasName && i ? '?:' : ''

			if (opt) {
				return `(${prefix}${str})?`
			} else {
				return hasName && !hasNestedItems && wrapToGroup
					? `(${str})`
					: str
			}
		})

	let combinedPattern = combinedPatternParts[0]

	for (
		let i = 2;
		i < combinedPatternParts.length + 1;
		i++
	) {
		const part = combinedPatternParts[i - 1]
		const prevItem = items[i - 1]

		if (prevItem) {
			combinedPattern += prevItem.isOptional
				? `(?:${delimiter})?`
				: delimiter
		}

		combinedPattern += part
	}

	return deep
		? combinedPattern
		: new RegExp(`^${combinedPattern}\\s*$`)
}

export const getDataFromItems = (
	items: TItem[],
	matches: RegExpMatchArray,
	i = 0
) => {
	//console.log(items, matches)
	const itemsData = items.reduce(
		(r, item) => {
			if (item.name) {
				if (item.nested?.length) {
					const { index, itemsData } = getDataFromItems(
						item.nested,
						matches,
						i
					)
					r[item.name] = itemsData
					i = index
				} else {
					r[item.name] = matches[i] || ''
					i += 1
				}
			}
			return r
		},
		{} as Record<string, any>
	)

	return {
		index: i,
		itemsData
	}
}
