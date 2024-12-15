import {
	DEFAULT_SETTINGS,
	type ILoggerSettings
} from 'src/settings/types'

export const S = $state<{
	settings: ILoggerSettings
	save: (changes: ((s: ILoggerSettings) => void)[]) => void
	openedBlockId: string
	openedItemId: string
}>({
	settings: DEFAULT_SETTINGS,
	save: () => {},
	openedBlockId: '',
	openedItemId: ''
})
