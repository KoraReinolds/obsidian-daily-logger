import LoggerPlugin from 'main'
import {
	App,
	Notice,
	PluginSettingTab,
	Setting
} from 'obsidian'
import Sortable from 'sortablejs'
import { itemData } from 'src/entities'
import { type TItemData } from 'src/entities/types'
import { mount } from 'svelte'
import { v4 as uuidv4 } from 'uuid'
import Component from '../components/settings.svelte'
import General from '../components/settingsGeneral.svelte'
import Logger from '../components/settingsLogger.svelte'
import Template from '../components/settingsTemplate.svelte'
import { displayTabs } from './tabs'
import {
	DEFAUTL_ITEM_DATA,
	EItemType,
	ELoggerType,
	type ILoggerSettings,
	type TBlock,
	type TItem,
	type TTabs
} from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	globalBlockCopy: TItem
	itemCopy: TItem
	blockCopy: TBlock
	openedBlockId?: string
	openedItemId?: string
	tabs: TTabs = {
		list: []
	}

	constructor(app: App, plugin: LoggerPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
		this.tabs.list = [
			{
				name: 'General',
				type: ELoggerType.GENERAL,
				render: this.displayGeneralTab.bind(this),
				component: General
			},
			{
				name: 'Logs',
				type: ELoggerType.LOGGER,
				render: this.displayTab.bind(this),
				component: Logger,
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
				component: Template,
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
			this.tabs.active = this.tabs.list[1]
		}
	}

	addNewItem(params: Partial<TItem> = {}) {
		const id = uuidv4()

		this.settings.items[id] = {
			id: id,
			type: 'text',
			name: '',
			value: '',
			anyText: false,
			isOptional: false,
			defaultValue: '',
			nested: [],
			delimiter: '',
			...params
		}

		return id
	}

	addNewBlock(list: TBlock[], type: ELoggerType) {
		const id = uuidv4()
		const name = 'New log'

		list.push({
			id,
			type,
			name,
			order: []
		})

		this.plugin.saveSettings()
	}

	getValueFromItem(item: TItem): string {
		switch (item.type) {
			case EItemType.text:
			case EItemType.hours:
			case EItemType.minutes:
			case EItemType.link: {
				if (item.anyText) return '...'
				return item.value
			}
			default: {
				const block = this.settings.blocks.find(
					(block) => block.id === item.type
				)

				if (!block) return ''

				return block.order
					.map((id) => this.settings.items[id])
					.map((item) => this.getValueFromItem(item))
					.join(item.delimiter)
			}
		}
	}

	calculateText(block: TBlock) {
		return block.order
			.map((id) => this.settings.items[id])
			.filter((item) => !!item)
			.map((item) => this.getValueFromItem(item))
			.join(this.settings.global.delimiter)
	}

	displayPreview() {
		this.settings.blocks.forEach((block) => {
			if (!block.headerEl) return

			const desc = this.calculateText(block)

			block.headerEl.setDesc(desc)
			block.headerEl.setName(block.name)
		})
	}

	displayItemDetails(
		header: Setting,
		item: TItem,
		containerEl: HTMLElement
	) {
		const templates = this.getListByType(
			ELoggerType.TEMPLATE
		)
			.map((item) => [item.id, item.name])
			.filter(([id]) => {
				return id !== this.openedBlockId
			})

		// item type
		if (templates.length) {
			new Setting(containerEl)
				.setName('Type')
				.addDropdown((dd) =>
					dd
						.addOptions(Object.fromEntries(templates))
						.setValue(item.type)
						.onChange((value) => {
							item.type = value

							const data: TItemData =
								(itemData[
									item.type as EItemType
								] as TItemData) || DEFAUTL_ITEM_DATA

							item.value = data.defaultValue

							this.plugin.saveSettings()
							this.display()
						})
				)
				.setClass('daily-logger-block-item-data')
		}

		// item key
		new Setting(containerEl)
			.setName('Key')
			.addText((text) =>
				text
					.setPlaceholder('Type key')
					.setValue(item.name)
					.onChange(async (value) => {
						item.name = value
						header.setName(value)
						await this.plugin.saveSettings()
					})
			)
			.setClass('daily-logger-block-item-data')

		// item any text
		if (item.type === EItemType.text)
			new Setting(containerEl)
				.setName('Any text')
				.addToggle((comp) =>
					comp
						.setValue(item.anyText)
						.onChange(async (val) => {
							item.anyText = val

							await this.plugin.saveSettings()
							this.displayPreview()
							this.display()
						})
				)
				.setClass('daily-logger-block-item-data')

		const data = itemData[item.type as EItemType]
		// item value
		if (!item.anyText)
			new Setting(containerEl)
				.setName('Value')
				.addText((text) =>
					text
						.setPlaceholder('Type value')
						.setValue(this.getValueFromItem(item))
						.onChange(async (value) => {
							item.value = value
							header.setDesc(value)
							await this.plugin.saveSettings()
							this.settings = this.plugin.settings
							this.displayPreview()
						})
						.setDisabled(data ? data.isDisabled : true)
				)
				.setClass('daily-logger-block-item-data')

		// item default value
		new Setting(containerEl)
			.setName('Default value')
			.addText((text) =>
				text
					.setPlaceholder('Type default value')
					.setValue(item.defaultValue)
					.onChange(async (value) => {
						item.defaultValue = value
						await this.plugin.saveSettings()
					})
					.setDisabled(data ? data.isDisabled : true)
			)
			.setClass('daily-logger-block-item-data')

		// item optional
		new Setting(containerEl)
			.setName('Optional value')
			.addToggle((comp) =>
				comp
					.setValue(item.isOptional)
					.onChange(async (val) => {
						item.isOptional = val

						await this.plugin.saveSettings()
					})
			)
			.setClass('daily-logger-block-item-data')

		// item delimiter
		if (!EItemType[item.type]) {
			new Setting(containerEl)
				.setName('Delimiter')
				.addText((text) =>
					text
						.setPlaceholder('Overwrite global delimiter')
						.setValue(item.delimiter)
						.onChange((value) => {
							item.delimiter = value

							this.plugin.saveSettings()
							this.displayPreview()
							header.setDesc(this.getValueFromItem(item))
						})
				)
				.setClass('daily-logger-block-item-data')
		}
	}

	displayItems(block: TBlock, containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName('Command name')
			.setDesc('Name of command for call this log')
			.addText((text) =>
				text
					.setPlaceholder('Type name')
					.setValue(block.name)
					.onChange((value) => {
						block.name = value

						this.plugin.saveSettings()
						this.displayPreview()
					})
			)
			.setClass('daily-logger-block-item-header')

		const { order } = block
		const items = this.settings.items

		const ul = containerEl.createEl('ul')
		ul.classList.add('daily-logger-block-item-list')

		order.forEach((id) => {
			const item = items[id]

			if (!item) return

			const itemEl = ul.createEl('li')
			itemEl.classList.add('daily-logger-block-item')

			const blockHeader = new Setting(itemEl)
				.setName(item.name)
				.setDesc(this.getValueFromItem(item))
				.setClass('daily-logger-block-item-header')

			// copy item
			blockHeader.addButton((btn) => {
				btn
					.setIcon('copy')
					.onClick(() => {
						this.itemCopy = item
						this.plugin.saveSettings()

						this.display()
						new Notice('Copy item')
					})
					.setTooltip('Copy item')
			})

			// show/hide item
			blockHeader.addButton((btn) => {
				const hidden = !(this.openedItemId === id)

				btn
					.setIcon(hidden ? 'eye' : 'eye-off')
					.onClick(() => {
						this.openedItemId = hidden ? id : undefined

						this.display()
					})
				btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
					hidden ? 'Show' : 'Hide'
				}</span>`
			})

			// remove item
			blockHeader.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					delete this.settings.items[id]

					block.order = order.filter(
						(blockId) => blockId !== id
					)

					this.plugin.saveSettings()
					this.display()
				})
			})

			// drag block
			blockHeader.addButton((btn) => {
				btn
					.setIcon('grip-vertical')
					.setClass('daily-logger-item-drag')
			})

			if (this.openedItemId !== id) return

			this.displayItemDetails(blockHeader, item, itemEl)
		})

		Sortable.create(ul, {
			handle: '.daily-logger-item-drag',
			onEnd: (evt) => {
				if (
					evt.oldIndex === undefined ||
					evt.newIndex === undefined
				)
					return
				;[
					[block.order[evt.oldIndex]],
					[block.order[evt.newIndex]]
				] = [
					[block.order[evt.newIndex]],
					[block.order[evt.oldIndex]]
				]

				this.plugin.saveSettings()
				this.displayPreview()
			}
		})
	}

	displayBlocks(containerEl: HTMLElement, list: TBlock[]) {
		containerEl.empty()

		list.forEach((block) => {
			const id = block.id

			const blockEl = containerEl.createDiv()
			blockEl.classList.add('daily-logger-block')

			// block header
			const header =
				block.headerEl ||
				new Setting(blockEl)
					.setName(block.name)
					.setDesc(this.calculateText(block))
					.setClass('daily-logger-block-header')

			if (block.headerEl) {
				blockEl.empty()
				blockEl.append(header.settingEl)
				block.headerEl.controlEl.empty()
			} else {
				block.headerEl = header
			}

			// block template
			if (block.type === ELoggerType.LOGGER) {
				header.addButton((btn) => {
					btn
						.setIcon('copy')
						.onClick(() => {
							this.blockCopy = block
							this.plugin.saveSettings()

							this.display()
							new Notice('Copy block')
						})
						.setTooltip('Copy block')
				})
			}

			// copy block
			header.addButton((btn) => {
				btn
					.setIcon('clipboard-paste')
					.setTooltip('Paste item')
					.onClick(() => {
						this.itemCopy
						block
						const id = this.addNewItem(this.itemCopy)
						block.order.push(id)
						this.plugin.saveSettings()
						this.display()
					})
					.setDisabled(
						!!block.locked ||
							!this.itemCopy ||
							this.itemCopy.type === block.id // same template
					)
			})

			// add item to block
			header.addButton((btn) => {
				btn
					.setIcon('plus')
					.setDisabled(!!block.locked)
					.onClick(() => {
						this.settings

						block.order.push(this.addNewItem())
						this.openedBlockId = id
						this.display()
					})
			})

			// show/hide block
			header.addButton((btn) => {
				const hidden = !(this.openedBlockId === id)

				btn
					.setIcon(hidden ? 'eye' : 'eye-off')
					.setDisabled(!!block.locked)
					.onClick(() => {
						this.openedBlockId = hidden ? id : undefined

						this.display()
					})
				btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
					hidden ? 'Show' : 'Hide'
				}</span>`
			})

			// remove block
			header.addButton((btn) => {
				btn
					.setIcon('trash-2')
					.setDisabled(!!block.locked)
					.onClick(() => {
						block.order.forEach(
							(id) => delete this.settings.items[id]
						)

						this.settings.blocks =
							this.settings.blocks.filter(
								(item) => item.id !== id
							)

						this.plugin.saveSettings()
						this.display()
					})
			})

			if (this.openedBlockId === id) {
				this.displayItems(block, blockEl)
			}
		})
	}

	displayGeneralTab(containerEl: HTMLElement) {
		containerEl.empty()

		containerEl.classList.add('daily-logger-block')
	}

	displayTab(containerEl: HTMLElement) {
		containerEl.empty()

		const activeTab = this.tabs.active

		if (!activeTab) return

		const logsContent = containerEl.createDiv()
		const blocks = this.settings.blocks

		logsContent.classList.add('daily-logger-blocks')

		const header = activeTab.data?.settings.header

		if (header) {
			const blockHeader = new Setting(logsContent)
				.addButton((btn) => {
					btn
						.setIcon('clipboard-paste')
						.setTooltip('Paste block')
						.onClick(() => {
							if (!this.tabs.active) return

							const blockCopy: TBlock = {
								...this.blockCopy,
								id: uuidv4(),
								headerEl: undefined
							}
							const orderCopy: string[] = []

							blockCopy.order
								.map((id) => this.settings.items[id])
								.forEach((item) => {
									const id = uuidv4()
									this.settings.items[id] = {
										...JSON.parse(JSON.stringify(item)),
										id
									}
									orderCopy.push(id)
								})

							blockCopy.order = orderCopy
							blockCopy.type = this.tabs.active?.type

							this.settings.blocks.push(blockCopy)
							this.plugin.saveSettings()

							this.display()
						})
				})
				.setDisabled(!this.blockCopy)

			blockHeader
				.addButton((btn) =>
					btn.setButtonText(header.btnText).onClick(() => {
						this.addNewBlock(blocks, activeTab.type)
						this.display()
					})
				)
				.setClass('daily-logger-blocks-header')
		}

		const blocksContent = logsContent.createDiv()
		blocksContent.classList.add(
			'daily-logger-blocks-content'
		)

		this.displayBlocks(
			blocksContent,
			this.getListByType(activeTab.type)
		)
	}

	getListByType(type: ELoggerType): TBlock[] {
		return this.settings.blocks.filter(
			(block) => block.type === type
		)
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()

		mount(Component, {
			target: containerEl,
			props: {
				tabs: this.tabs,
				//settings: JSON.parse(JSON.stringify(this.settings)),
				settings: this.settings,
				save: (settings: ILoggerSettings) => {
					debugger
					this.plugin.settings = settings
					this.plugin.saveSettings()
				}
			}
		})

		new Setting(containerEl)
			.addButton((btn) =>
				btn.setButtonText('Default').onClick(async () => {
					await this.plugin.clearData()
					this.settings = this.plugin.settings
					this.display()
				})
			)
			.addButton((btn) =>
				btn
					.setButtonText('Clear changes')
					.onClick(async () => {
						await this.plugin.clearChanges()
						this.settings = this.plugin.settings
						this.display()
					})
			)
			.addButton((btn) =>
				btn
					.setIcon('save')
					.onClick(async () => {
						await this.plugin.saveAll()
					})
					.setCta()
			)

		displayTabs(containerEl, this.tabs)
		this.displayPreview()
	}
}
