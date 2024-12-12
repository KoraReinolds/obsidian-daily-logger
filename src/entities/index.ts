import { TItemData } from 'src/entities/types'
import { FindOrCreateNoteModal } from 'src/lib/fuzzyModal'
import { EItemType, TItem } from 'src/settings/types'

enum EMoment {
	YYYY = 'YYYY',
	MM = 'MM',
	DD = 'DD',
	HH = 'HH',
	mm = 'mm'
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
		toRegexpr: async (item) => item.value.trim(),
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
