import {
	DEFAULT_SETTINGS,
	type ILoggerSettings
} from 'src/settings/types'

export const S = $state<{
	settings: ILoggerSettings
	save: (changes: ((s: ILoggerSettings) => void)[]) => void
}>({
	settings: DEFAULT_SETTINGS,
	save: () => {}
})
