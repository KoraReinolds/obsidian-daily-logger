import { TItemData } from 'src/entities/types'
import { EItemType, TItem } from 'src/settings/types'

export const itemData: Record<EItemType, TItemData> = {
	[EItemType.key]: {
		toValue: async (item) => item.value,
		toRegexpr: async (item) => item.value
	},
	[EItemType.link]: {
		toValue: async (item) => item.value,
		toRegexpr: async (item) => item.value
	},
	[EItemType.text]: {
		toValue: async (item) => item.value,
		toRegexpr: async (item) => item.value
	},
	[EItemType.time]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		toRegexpr: async (item) => `\\d+:\\d+`
	}
}

export const generateDynamicRegExp = async (
	items: TItem[]
): Promise<RegExp> => {
	const combinedPattern = (
		await Promise.all(
			items.map((item) => {
				const data = itemData[item.type as EItemType]
				if (!data) {
					throw new Error(`Unknown type: ${item.type}`)
				}
				return data.toRegexpr(item)
			})
		)
	)
		.map((str) => `(${str})`)
		.join(' ')

	return new RegExp(`^${combinedPattern}$`)
}
