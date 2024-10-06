export type TBlockType = 'key' | 'time' | 'link' | 'text'

export type TCustomBlock = {
	id: string
	name: string
	type: TBlockType
	value: string
}

export type TLoggerBlock = {
	id: string
	blocks: TCustomBlock[]
	order: string[]
}

export interface ILoggerSettings {
	prefix: string
	loggerBlocks: TLoggerBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	prefix: '',
	loggerBlocks: []
}
