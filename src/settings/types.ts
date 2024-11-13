export enum EItemType {
	KEY = 'key',
	TIME = 'time',
	LINK = 'link',
	TEXT = 'text',
	SLOT = 'slot'
}

export type TItemDataType = {
	defaultValue: string
}

export const DEFAUTL_ITEM_DATA: TItemDataType = {
	defaultValue: ''
}

export const itemData: Record<EItemType, TItemDataType> = {
	[EItemType.KEY]: { defaultValue: '' },
	[EItemType.TIME]: { defaultValue: 'HH:mm' },
	[EItemType.LINK]: { defaultValue: '' },
	[EItemType.TEXT]: { defaultValue: '' }
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
}

export type TBlock = {
	id: string
	type: ELoggerType
	name: string
	order: string[]
	locked?: boolean
}

export interface ILoggerSettings {
	items: Record<string, TItem>
	blocks: TBlock[]
}

export const DEFAULT_SETTINGS: ILoggerSettings = {
	items: {},
	blocks: [
		{
			id: EItemType.TEXT,
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Text',
			locked: true
		},
		{
			id: EItemType.TIME,
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
