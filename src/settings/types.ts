import { Setting } from 'obsidian'

export enum EItemType {
	key = 'key',
	time = 'time',
	link = 'link',
	text = 'text'
}

export const DEFAUTL_ITEM_DATA = {
	defaultValue: ''
}

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
	type: string
	value: string
	el?: HTMLElement
}

export type TBlock = {
	id: string
	type: ELoggerType
	name: string
	order: string[]
	locked?: boolean
	headerEl?: Setting
}

export interface ILoggerSettings {
	items: Record<string, TItem>
	blocks: TBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	items: {},
	blocks: [
		{
			id: EItemType.text,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Text',
			locked: true
		},
		{
			id: EItemType.time,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Time',
			locked: true
		}
	]
}

export interface ITabData {
	settings: {
		header: {
			btnText: string
		}
	}
}
