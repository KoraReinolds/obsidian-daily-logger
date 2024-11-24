import { TItemData } from 'src/entities/types'
import { FindOrCreateNoteModal } from 'src/lib/fuzzyModal'
import { EItemType, TItem } from 'src/settings/types'

export const momentPatternToRegex = (pattern: string) => {
	const replacements = {
		YYYY: '\\d{4}',
		MM: '0[1-9]|1[0-2]',
		DD: '0[1-9]|[12]\\d|3[01]',
		HH: '\\d+',
		mm: '\\d+'
	}

	const escapedPattern = pattern.replace(
		// eslint-disable-next-line
		/[-\/\\^$*+?.()|[\]{}]/g,
		'\\$&'
	)

	const regexPattern = Object.entries(replacements).reduce(
		(acc, [key, value]) =>
			acc.replace(new RegExp(`\\b${key}\\b`, 'g'), value),
		escapedPattern
	)

	return regexPattern
}

export const itemData: Record<EItemType, TItemData> = {
	[EItemType.key]: {
		toValue: async (item) => item.value,
		defaultValue: '',
		toRegexpr: async (item) => item.value
	},
	[EItemType.link]: {
		toValue: async (item) => {
			return await new FindOrCreateNoteModal(
				// @ts-ignore
				app,
				item.value
			).open()
		},
		defaultValue: '',
		toRegexpr: async (item) => `\\[\\[([^\\]]+)\\]\\]`
	},
	[EItemType.text]: {
		toValue: async (item) => item.value,
		defaultValue: '',
		toRegexpr: async (item) => item.value
	},
	[EItemType.time]: {
		// @ts-ignore
		toValue: async (item) => moment().format(item.value),
		defaultValue: 'HH:mm',
		toRegexpr: async (item) =>
			momentPatternToRegex(item.value)
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
