import LoggerPlugin from 'main'
import {
	App,
	Notice,
	PluginSettingTab,
	Setting
} from 'obsidian'
import { itemData } from 'src/entities'
import { TItemData } from 'src/entities/types'
import { v4 as uuidv4 } from 'uuid'
import { displayTabs } from './tabs'
import {
	ELoggerType,
	ILoggerSettings,
	EItemType,
	TItem,
	TBlock,
	TTabs,
	DEFAUTL_ITEM_DATA
} from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	globalBlockCopy: TItem
	blockCopy: TItem
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
				render: this.displayGeneralTab.bind(this)
			},
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
			nested: [],
			delimiter: '',
			...params
		}

		return id
	}

	addNewBlock(list: TBlock[], type: ELoggerType) {
		const id = uuidv4()
		const name = 'New log'
		const keyId =
			type === ELoggerType.LOGGER
				? this.addNewItem({
						type: 'key',
						name: 'key'
					})
				: ''

		list.push({
			id,
			type,
			name,
			order: keyId ? [keyId] : []
		})

		this.plugin.saveSettings()
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

		const data = itemData[item.type as EItemType]
		// item value
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

		order.forEach((id, i) => {
			const item = items[id]

			if (!item) return

			const itemEl = containerEl.createDiv()
			itemEl.classList.add('daily-logger-block-item')

			const blockItem = new Setting(itemEl)
				.setName(item.name)
				.setDesc(this.getValueFromItem(item))
				.setClass('daily-logger-block-item-header')

			const templates = this.getListByType(
				ELoggerType.TEMPLATE
			)
				.map((item) => [item.id, item.name])
				.filter(([id]) => {
					return id !== block.id
				})

			// item type
			if (item.type !== EItemType.key && templates.length) {
				blockItem.addDropdown((dd) =>
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
			}

			// copy item
			if (item.type !== 'key')
				blockItem.addButton((btn) => {
					btn.setIcon('copy').onClick(() => {
						this.blockCopy = item
						this.plugin.saveSettings()

						this.display()
						new Notice('Copy block')
					})
				})

			// move item up
			blockItem.addButton((btn) => {
				btn.setIcon('move-up').onClick(() => {
					const item = block.order[i]
					const newOrder = [...block.order]

					newOrder.splice(i, 1)
					newOrder.splice(
						i ? i - 1 : block.order.length,
						0,
						item
					)

					block.order = newOrder

					this.plugin.saveSettings()
					this.display()
				})
			})

			// move item down
			blockItem.addButton((btn) => {
				btn.setIcon('move-down').onClick(() => {
					const item = block.order[i]
					const newOrder = [...block.order]

					newOrder.splice(i, 1)
					newOrder.splice(
						i === block.order.length - 1 ? 0 : i + 1,
						0,
						item
					)

					block.order = newOrder

					this.plugin.saveSettings()
					this.display()
				})
			})

			// show/hide item
			blockItem.addButton((btn) => {
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
			blockItem.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					delete this.settings.items[id]

					block.order = order.filter(
						(blockId) => blockId !== id
					)

					this.plugin.saveSettings()
					this.display()
				})

				if (item.type === 'key') btn.setDisabled(true)
			})

			if (this.openedItemId !== id) return

			this.displayItemDetails(blockItem, item, itemEl)
		})
	}

	getValueFromItem(item: TItem): string {
		switch (item.type) {
			case EItemType.text:
			case EItemType.hours:
			case EItemType.minutes:
			case EItemType.key:
			case EItemType.link:
				return item.value
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
					btn.setIcon('layout-template').onClick(() => {
						const blockCopy: TBlock = {
							...block,
							id: uuidv4(),
							headerEl: undefined
						}
						const orderCopy: string[] = []

						blockCopy.order
							.map((id) => this.settings.items[id])
							.filter(
								(block) => block && block.type !== 'key'
							)
							.forEach((item) => {
								const id = uuidv4()
								this.settings.items[id] = {
									...JSON.parse(JSON.stringify(item)),
									id
								}
								orderCopy.push(id)
							})

						blockCopy.order = orderCopy
						blockCopy.type = ELoggerType.TEMPLATE

						this.settings.blocks.push(blockCopy)
						this.plugin.saveSettings()

						this.display()
						new Notice('Template created')
					})
				})
			}

			// copy block
			header.addButton((btn) => {
				btn
					.setIcon('clipboard-paste')
					.onClick(() => {
						this.blockCopy
						block
						const id = this.addNewItem(this.blockCopy)
						block.order.push(id)
						this.plugin.saveSettings()
						this.display()
					})
					.setDisabled(
						!!block.locked ||
							!this.blockCopy ||
							this.blockCopy.type === block.id // same template
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

		new Setting(containerEl)
			.setName('Folder path')
			.setDesc('Specify folder for logs')
			.addText((text) =>
				text
					.setPlaceholder('Type folder path')
					.setValue(this.settings.global.folderPath)
					.onChange((value) => {
						this.settings.global.folderPath = value

						this.plugin.saveSettings()
					})
			)

		const globalDeimiter = new Setting(containerEl)
			.setDesc('Specify delimiter for logs')
			.addText((text) =>
				text
					.setPlaceholder('Type delimiter')
					.setValue(this.settings.global.delimiter)
					.onChange((value) => {
						this.settings.global.delimiter = value

						setDelimiter(value)

						this.plugin.saveSettings()
						this.displayPreview()
					})
			)

		const setDelimiter = (value: string) => {
			globalDeimiter.setName(`Delimiter - "${value}"`)
		}

		setDelimiter(this.settings.global.delimiter)
	}

	displayTab(containerEl: HTMLElement) {
		containerEl.empty()

		const activeTab = this.tabs.active

		if (!activeTab) return

		const logsContent = containerEl.createDiv()
		const blocks = this.settings.blocks

		logsContent.classList.add('daily-logger-blocks')

		const header = activeTab.data?.settings.header

		if (header)
			new Setting(logsContent)
				.addButton((btn) =>
					btn.setButtonText(header.btnText).onClick(() => {
						this.addNewBlock(blocks, activeTab.type)
						this.display()
					})
				)
				.setClass('daily-logger-blocks-header')

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

		console.log(this.settings)
		displayTabs(containerEl, this.tabs)
		this.displayPreview()
	}
}
