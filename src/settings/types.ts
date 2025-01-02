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
	component?: any
	data?: ITabData
	type: ELoggerType
}

export type TTabs = {
	active?: TTab
	list: TTab[]
	order: string[]
	data: Record<string, TTab>
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
}

export type TMeta = {
	id: string
	key: string
	value: string
}

export type TBlock = {
	id: string
	type: ELoggerType
	name: string
	order: string[]
	meta: TMeta[]
	sectionName: string
	locked?: boolean
	groups: string[]
}

export interface ILoggerSettings {
	tabs: TTabs
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
	tabs: {
		order: [
			ELoggerType.GENERAL,
			ELoggerType.LOGGER,
			ELoggerType.TEMPLATE
		],
		data: {
			[ELoggerType.GENERAL]: {
				name: 'General',
				type: ELoggerType.GENERAL
			},
			[ELoggerType.LOGGER]: {
				name: 'All',
				type: ELoggerType.LOGGER,
				data: {
					settings: {
						header: {
							btnText: 'Add New Log'
						}
					}
				}
			},
			[ELoggerType.TEMPLATE]: {
				name: 'Templates',
				type: ELoggerType.TEMPLATE,
				data: {
					settings: {
						header: {
							btnText: 'Add New Template'
						}
					}
				}
			}
		},
		list: []
	},
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
			meta: [],
			sectionName: '',
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Text',
			locked: true,
			groups: ['template']
		},
		{
			id: EItemType.hours,
			meta: [],
			sectionName: '',
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Hours',
			locked: true,
			groups: ['template']
		},
		{
			id: EItemType.minutes,
			meta: [],
			sectionName: '',
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Minutes',
			locked: true,
			groups: ['template']
		},
		{
			id: EItemType.link,
			meta: [],
			sectionName: '',
			type: ELoggerType.TEMPLATE,
			order: [],
			name: 'Link',
			locked: true,
			groups: ['template']
		}
	]
}

export interface ITabData {
	settings: {
		header: {
			remove?: boolean
			btnText?: string
			rename?: boolean
		}
	}
}
