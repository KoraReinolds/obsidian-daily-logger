import type { TItemData } from 'src/entities/types'
import { FindOrCreateNoteModal } from 'src/lib/fuzzyModal'
import {
	EItemType,
	type TItem,
	type ILoggerSettings,
	type TBlock
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
		toRegexpr: async () => `\\[\\[[^\\]]+\\]\\]`,
		isDisabled: false
	},
	[EItemType.text]: {
		toValue: async (item) => item.value,
		defaultValue: '',
		toRegexpr: async (item) => {
			if (item.anyText) return `.+?`
			return item.value.trim()
		},
		isDisabled: false
	},
	[EItemType.hours]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		defaultValue: 'HH',
		toRegexpr: async (item) =>
			momentPatternToRegex(item.value as EMoment),
		isDisabled: true
	},
	[EItemType.minutes]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		defaultValue: 'mm',
		toRegexpr: async (item) =>
			momentPatternToRegex(item.value as EMoment),
		isDisabled: true
	}
}

export const generateTemplate = async (params: {
	items: TItem[]
	wrapToGroup: boolean
}): Promise<string> => {
	const { items, wrapToGroup } = params

	const combinedPatternParts = await Promise.all(
		items.map((item) => {
			if (item.nested?.length) {
				return generateTemplate({
					items: item.nested,
					wrapToGroup: !!item.name
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

	return combinedPatternParts.join(' ')
}

export const generateDynamicRegExp = async (params: {
	items: TItem[]
	deep: boolean
	wrapToGroup: boolean
	delimiter: string
}): Promise<RegExp | string> => {
	const { items, deep, wrapToGroup, delimiter } = params

	const combinedPatternParts = (
		await Promise.all(
			items.map((item) => {
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
		)
	)
		.filter((str) => !!str)
		.map((str, i) => {
			const opt = items[i].isOptional ? '?' : ''

			return items[i].name &&
				!items[i].nested?.length &&
				wrapToGroup
				? `(${str})${opt}`
				: `${str}${opt}`
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
				? `(${delimiter})?`
				: delimiter
		}

		combinedPattern += part
	}

	return deep
		? combinedPattern
		: new RegExp(`^\\s*${combinedPattern}\\s*$`)
}
