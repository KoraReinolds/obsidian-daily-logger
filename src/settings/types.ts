export type TBlockType = 'key' | 'time' | 'link' | 'text'

export type TTab = {
	name: string
	render?: (el: HTMLElement) => void
	data: ITabData
	type: ELoggerType
}

export type TTabs = {
	active?: TTab
	list: TTab[]
	container?: HTMLElement
	contentContainer?: HTMLElement
}

export enum ELoggerType {
	TEMPLATE = 'template',
	LOGGER = 'logger'
}

export type TItem = {
	id: string
	name: string
	type: TBlockType
	value: string
}

export type TBlock = {
	id: string
	type: ELoggerType
	name: string
	order: string[]
}

export interface ILoggerSettings {
	items: Record<string, TItem>
	blocks: TBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	items: {},
	blocks: []
}

export interface ITabData {
	settings: {
		blocks: TBlock[]
		header: {
			btnText: string
		}
	}
}
