import {
	App,
	Notice,
	PluginSettingTab,
	Setting
} from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import {
	default as LoggerPlugin,
	default as MemoPlugin
} from '../../main'
import { displayTabs } from './tabs'
import {
	ELoggerType,
	ILoggerSettings,
	TBlockType,
	TItem,
	TBlock,
	TTabs
} from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	preview: { text: Setting; block: TBlock }[] = []
	globalPrefix = ''
	globalBlockCopy: TItem
	blockCopy: TItem
	openedBlockId?: string
	tabs: TTabs = {
		list: []
	}

	constructor(app: App, plugin: MemoPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
		this.tabs.list = [
			{
				name: 'Logs',
				type: ELoggerType.LOGGER,
				render: this.displayTab.bind(this),
				data: {
					settings: {
						header: {
							btnText: 'Add New Log'
						}
					}
				}
			},
			{
				name: 'Templates',
				type: ELoggerType.TEMPLATE,
				render: this.displayTab.bind(this),
				data: {
					settings: {
						header: {
							btnText: 'Add New Template'
						}
					}
				}
			}
		]

		if (!this.tabs.active) {
			this.tabs.active = this.tabs.list[0]
		}
	}

	addNewBlock(params: Partial<TItem> = {}) {
		const id = uuidv4()

		this.settings.items[id] = {
			id: id,
			type: 'text',
			name: '',
			value: '',
			...params
		}

		return id
	}

	addNewLog(list: TBlock[], type: ELoggerType) {
		const id = uuidv4()
		const name = 'New log'
		const keyId = this.addNewBlock({
			type: 'key',
			name: 'key'
		})

		list.push({
			id,
			type,
			name,
			order: [keyId]
		})

		this.plugin.saveSettings()
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()

		displayTabs(containerEl, this.tabs)
	}

	calculateText(block: TBlock) {
		return block.order
			.map((id) => this.settings.items[id])
			.filter((item) => !!item)
			.map((block) => block?.value)
			.join(' ')
	}

	displayPreview() {
		this.preview.forEach(({ text, block }) => {
			text.setName(block.name)
			text.setDesc(this.calculateText(block))
		})
	}

	displayOrderedBlocks(
		params: {
			order: string[]
			name: string
			id: string
		},
		containerEl: HTMLElement
	) {
		new Setting(containerEl)
			.setName('Command name')
			.setDesc('Name of command for call this log')
			.addText((text) =>
				text
					.setPlaceholder('Type name')
					.setValue(params.name)
					.onChange((value) => {
						params.name = value

						this.plugin.saveSettings()
						this.displayPreview()
					})
			)

		console.log(params)
		const { order } = params
		const blocks = this.settings.items

		order.forEach((id, i) => {
			const item = blocks[id]

			if (!item) return
			const blockItem = new Setting(containerEl)
			// .setName('')
			// .setDesc('')

			if (item.type !== 'key')
				blockItem.addDropdown((dd) =>
					dd
						.addOptions({
							text: 'Text',
							time: 'Time',
							link: 'Link'
						})
						.setValue(item.type)
						.onChange((value) => {
							item.type = value as TBlockType
							this.plugin.saveSettings()
							this.display()
						})
				)

			if (item.type !== 'key')
				blockItem.addButton((btn) => {
					btn.setIcon('copy').onClick(() => {
						this.blockCopy = item
						this.plugin.saveSettings()

						this.display()
						new Notice('Copy block')
					})
				})

			blockItem.addButton((btn) => {
				btn.setIcon('move-up').onClick(() => {
					const item = params.order[i]
					const newOrder = [...params.order]

					newOrder.splice(i, 1)
					newOrder.splice(
						i ? i - 1 : params.order.length,
						0,
						item
					)

					params.order = newOrder

					this.plugin.saveSettings()
					this.display()
				})
			})

			blockItem.addButton((btn) => {
				btn.setIcon('move-down').onClick(() => {
					const item = params.order[i]
					const newOrder = [...params.order]

					newOrder.splice(i, 1)
					newOrder.splice(
						i === params.order.length - 1 ? 0 : i + 1,
						0,
						item
					)

					params.order = newOrder

					this.plugin.saveSettings()
					this.display()
				})
			})

			blockItem.addText((text) =>
				text
					.setPlaceholder('Type key')
					.setValue(item.name)
					.onChange(async (value) => {
						item.name = value
						await this.plugin.saveSettings()
					})
			)

			blockItem.addText((text) =>
				text
					.setPlaceholder('Type value')
					.setValue(item.value)
					.onChange(async (value) => {
						item.value = value
						await this.plugin.saveSettings()
						this.displayPreview()
					})
			)

			blockItem.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					delete this.settings.items[id]

					params.order = order.filter(
						(blockId) => blockId !== id
					)

					this.plugin.saveSettings()
					this.display()
				})

				if (item.type === 'key') btn.setDisabled(true)
			})
		})
	}

	displayBlocks(containerEl: HTMLElement, list: TBlock[]) {
		containerEl.empty()

		this.preview = []

		list.forEach((block) => {
			const id = block.id

			const header = new Setting(containerEl)
				.setName(block.name)
				.setDesc(this.calculateText(block))

			this.preview.push({ text: header, block })

			header.addButton((btn) => {
				btn.setIcon('layout-template').onClick(() => {
					const blockCopy = { ...block, id: uuidv4() }
					const orderCopy: string[] = []

					blockCopy.order
						.map((id) => this.settings.items[id])
						.filter(
							(block) => block && block.type !== 'key'
						)
						.forEach((item) => {
							const id = uuidv4()
							this.settings.items[id] = {
								...item,
								id
							}
							orderCopy.push(id)
						})

					blockCopy.order = orderCopy

					this.settings.blocks.push(blockCopy)
					this.plugin.saveSettings()

					this.display()
					new Notice('Template created')
				})
			})

			header.addButton((btn) => {
				btn
					.setIcon('clipboard-paste')
					.onClick(() => {
						this.addNewBlock(this.blockCopy)
					})
					.setDisabled(!this.blockCopy)
			})

			header.addButton((btn) => {
				btn.setIcon('plus').onClick(() => {
					block.order.push(this.addNewBlock())
					this.openedBlockId = id
					this.display()
				})
			})

			header.addButton((btn) => {
				const hidden = !(this.openedBlockId === id)

				btn
					.setIcon(hidden ? 'eye' : 'eye-off')
					.onClick(() => {
						this.openedBlockId =
							this.openedBlockId === id ? undefined : id

						this.display()
					})
				btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
					hidden ? 'Show' : 'Hide'
				}</span>`
			})

			header.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					block.order.forEach(
						(id) => delete this.settings.items[id]
					)

					this.settings.blocks = list.filter(
						(item) => item.id !== id
					)

					this.plugin.saveSettings()
					this.display()
				})
			})

			if (this.openedBlockId === id) {
				this.displayOrderedBlocks(block, containerEl)
			}
		})
	}

	displayTab(containerEl: HTMLElement) {
		containerEl.innerHTML = ''

		const activeTab = this.tabs.active

		if (!activeTab) return

		const logsContent = containerEl.createDiv()
		const blocks = this.settings.blocks

		logsContent.classList.add('daily-logger-blocks')

		new Setting(logsContent).addButton((btn) =>
			btn
				.setButtonText(
					activeTab.data.settings.header.btnText
				)
				.onClick(() => {
					this.addNewLog(blocks, activeTab.type)
					this.display()
				})
		)

		const el = logsContent.createDiv()

		this.displayBlocks(
			el,
			blocks.filter(
				(block) => block.type === activeTab.type
			)
		)
	}
}
