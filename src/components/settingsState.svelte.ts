import {
	DEFAULT_SETTINGS,
	type ILoggerSettings,
	type TBlock,
	type TItem
} from 'src/settings/types'

export const S = $state<{
	settings: ILoggerSettings
	save: (changes: ((s: ILoggerSettings) => void)[]) => void
	openedBlockId: string
	openedItemId: string
	itemCopy: TItem | null
	blockCopy: TBlock | null
}>({
	settings: DEFAULT_SETTINGS,
	save: () => {},
	openedBlockId: '',
	openedItemId: '',
	itemCopy: null,
	blockCopy: null
})
