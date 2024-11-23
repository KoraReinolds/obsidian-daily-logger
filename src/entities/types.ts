import { TItem } from 'src/settings/types'

export type TItemData = {
	toValue: (item: TItem) => Promise<string>
	toRegexpr: (item: TItem) => Promise<string>
	defaultValue: string
}
