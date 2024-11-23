import { TItem } from 'src/settings/types'

export type TItemData = {
	toValue: (item: TItem) => Promise<string>
}
