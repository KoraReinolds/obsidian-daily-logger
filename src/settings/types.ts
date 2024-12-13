import { Setting } from 'obsidian'

export enum EItemType {
	hours = 'hours',
	minutes = 'minutes',
	link = 'link',
	text = 'text'
}

export const DEFAUTL_ITEM_DATA = {
	defaultValue: ''
}

export type TTab = {
	name: string
	render?: (el: HTMLElement) => void
	component: any
	data?: ITabData
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
	LOGGER = 'logger',
	GENERAL = 'general'
}

export type TItem = {
	id: string
	name: string
	type: string
	value: string
	defaultValue: string
	isOptional: boolean
	anyText: boolean
	nested: TItem[]
	delimiter: string
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
	global: {
		folderPath: string
		header: string
		delimiter: string
		sectionType: string
		sectionName: string
	}
	items: Record<string, TItem>
	blocks: TBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	global: {
		folderPath: '',
		header: '',
		delimiter: ' ',
		sectionType: '',
		sectionName: ''
	},
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
			id: EItemType.hours,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Hours',
			locked: true
		},
		{
			id: EItemType.minutes,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Minutes',
			locked: true
		},
		{
			id: EItemType.link,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Link',
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
