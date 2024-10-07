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
	blocks: TCustomBlock[]
	order: string[]
	loggerBlocks: TLoggerBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	blocks: [],
	order: [],
	loggerBlocks: []
}
