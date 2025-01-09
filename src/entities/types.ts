import type { TItem } from 'src/settings/types'

export type TItemData = {
	toValue: (item: TItem) => Promise<string>
	toRegexpr: (item: TItem) => string
	defaultValue: string
	isDisabled: boolean
}
