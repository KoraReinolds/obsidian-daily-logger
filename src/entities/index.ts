import { TItemData } from 'src/entities/types'
import { EItemType } from 'src/settings/types'

export const itemData: Record<EItemType, TItemData> = {
	[EItemType.key]: { toValue: async (item) => item.value },
	[EItemType.link]: { toValue: async (item) => item.value },
	[EItemType.text]: { toValue: async (item) => item.value },
	[EItemType.time]: {
		toValue: async (item) => moment().format(item.value)
	}
}
