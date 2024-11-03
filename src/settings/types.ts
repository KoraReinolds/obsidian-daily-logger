export type TBlockType = 'key' | 'time' | 'link' | 'text'

export enum ELoggerType {
	TEMPLATE = 'template',
	LOGGER = 'logger'
}

export type TCustomBlock = {
	id: string
	name: string
	type: TBlockType
	value: string
}

export type TLoggerBlock = {
	id: string
	type: ELoggerType
	name: string
	order: string[]
}

export interface ILoggerSettings {
	blocks: Record<string, TCustomBlock>
	loggerBlocks: TLoggerBlock[]
	templateBlocks: TLoggerBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	blocks: {},
	loggerBlocks: [],
	templateBlocks: []
}
