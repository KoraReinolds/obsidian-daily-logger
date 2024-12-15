import {
	DEFAULT_SETTINGS,
	type ILoggerSettings
} from 'src/settings/types'

export const S = $state<{
	settings: ILoggerSettings
}>({
	settings: DEFAULT_SETTINGS
})
