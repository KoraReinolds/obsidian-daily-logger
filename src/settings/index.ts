import MemoPlugin from '../../main'
import {
	App,
	Notice,
	PluginSettingTab,
	Setting
} from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import LoggerPlugin from '../../main'
import {
	ILoggerSettings,
	TBlockType,
	TCustomBlock,
	TLoggerBlock
} from './types'

type TTab = {
	name: string
	render?: (el: HTMLElement) => void
	onClick?: () => void
}

type TTabs = {
	active?: TTab
	list: TTab[]
	container?: HTMLElement
	contentContainer?: HTMLElement
}

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	preview: { text: Setting; block: TLoggerBlock }[] = []
	globalPrefix = ''
	globalBlockCopy: TCustomBlock
	blockCopy: TCustomBlock
	openedBlockId?: string
	globalTabs: TTabs = {
		list: [
			{ name: 'Logs', render: this.displayLogs.bind(this) },
			{
				name: 'Templates',
				render: this.displayTemplates.bind(this)
			}
		]
	}

	constructor(app: App, plugin: MemoPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
		if (!this.globalTabs.active) {
			this.globalTabs.active = this.globalTabs.list[0]
		}
	}

	addNewLog() {
		const id = uuidv4()
		const name = 'New log'

		this.settings.loggerBlocks.push({
			id,
			name,
			blocks: [],
			order: []
		})

		this.plugin.saveSettings()
	}

	displayTab(tabs: TTabs) {
		if (!tabs.active) return

		tabs.container
			?.querySelectorAll('.daily-logger-tabs li')
			.forEach((li: HTMLElement) => {
				li.classList.toggle(
					'active',
					li.innerText === tabs.active?.name
				)
			})

		if (tabs.contentContainer) {
			tabs.active.render?.(tabs.contentContainer)
		}
	}

	displayTabs(containerEl: HTMLElement, tabs: TTabs) {
		tabs.container = containerEl.createDiv()
		const ul = tabs.container.createEl('ul', {
			cls: 'daily-logger-tabs '
		})
		tabs.contentContainer = tabs.container.createEl('div')

		for (const tab of tabs.list) {
			const li = ul.createEl('li')
			li.innerHTML = tab.name
			li.addEventListener('click', () => {
				if (tab.render) {
					tabs.active = tab
					this.displayTab(tabs)
				}

				if (tab.onClick) {
					tab.onClick()
				}
			})
		}

		this.displayTab(tabs)
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		this.recalculateGlobalPrefix()

		this.displayTabs(containerEl, this.globalTabs)
	}

	recalculateGlobalPrefix() {
		this.globalPrefix = this.settings.order
			.map((id) =>
				this.settings.blocks.find(
					(block) => block.id === id
				)
			)
			.filter((item) => !!item)
			.map((block) => block?.value)
			.join(' ')
	}

	calculateText(block: TLoggerBlock) {
		return [
			this.globalPrefix,
			...block.order
				.map((id) =>
					block.blocks.find((block) => block.id === id)
				)
				.filter((item) => !!item)
				.map((block) => block?.value)
		].join(' ')
	}

	displayPreview() {
		this.recalculateGlobalPrefix()
		this.preview.forEach(({ text, block }) => {
			text.setName(block.name)
			text.setDesc(this.calculateText(block))
		})
	}

	displayOrderedBlocks(
		params: {
			order: string[]
			blocks: TCustomBlock[]
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

		const { order, blocks } = params

		order.forEach((id, i) => {
			const item = blocks.find((item) => item.id === id)

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
					const newOrder = [...params.order]
					;[
						newOrder[i],
						newOrder[i ? i - 1 : newOrder.length]
					] = [
						newOrder[i ? i - 1 : newOrder.length],
						newOrder[i]
					]

					params.order = newOrder

					this.plugin.saveSettings()
					// this.displayPreview()
					this.display()
				})
			})

			blockItem.addButton((btn) => {
				btn.setIcon('move-down').onClick(() => {
					const newOrder = [...params.order]
					;[
						newOrder[i],
						newOrder[(i + 1) % newOrder.length]
					] = [
						newOrder[(i + 1) % newOrder.length],
						newOrder[i]
					]

					params.order = newOrder

					this.plugin.saveSettings()
					// this.displayPreview()
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
					params.blocks = blocks.filter(
						(item) => item.id !== id
					)
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

	displayBlocks(containerEl: HTMLElement) {
		containerEl.empty()

		containerEl.classList.add('daily-logger-blocks')

		this.preview = []

		const list = this.settings.loggerBlocks

		list.forEach((block) => {
			const id = block.id

			const header = new Setting(containerEl)
				.setName(block.name)
				.setDesc(this.calculateText(block))

			this.preview.push({ text: header, block })

			const addNewBlock = (
				newBlock: Partial<TCustomBlock> = {}
			) => {
				const id = uuidv4()

				this.expandedBlocks[block.id] = true

				block.blocks.push({
					name: '',
					type: 'text',
					value: '',
					...newBlock,
					id
				})
				block.order.push(id)
				this.plugin.saveSettings()
				this.display()
			}

			header.addButton((btn) => {
				btn
					.setIcon('clipboard-paste')
					.onClick(() => {
						addNewBlock(this.blockCopy)
					})
					.setDisabled(!this.blockCopy)
			})

			header.addButton((btn) => {
				btn.setIcon('plus').onClick(() => {
					this.addNewLog()
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
					this.plugin.settings.loggerBlocks = list.filter(
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

	displayLogs(containerEl: HTMLElement) {
		containerEl.innerHTML = ''

		const blocks = containerEl.createDiv()

		this.displayBlocks(blocks)
	}

	displayTemplates(containerEl: HTMLElement) {
		containerEl.innerHTML = ''

		const list = this.settings.loggerBlocks

		new Setting(containerEl)
			.setName('Global blocks')
			.setDesc('Define rules for each log msg')
			.addButton((btn) =>
				btn
					.setButtonText('Add new block')
					.onClick(async () => {
						const blockId = uuidv4()
						list.push({
							id: uuidv4(),
							name: '',
							blocks: [
								{
									id: blockId,
									name: '',
									type: 'key',
									value: ''
								}
							],
							order: [blockId]
						})
						this.plugin.saveSettings()
						this.display()
					})
			)
			.addButton((btn) =>
				btn.setIcon('plus').onClick(async () => {
					const id = uuidv4()
					this.expandedBlocks['global'] = true

					this.settings.blocks.push({
						id,
						name: '',
						type: 'text',
						value: ''
					})
					this.settings.order.push(id)
					this.plugin.saveSettings()
					this.display()
				})
			)
			.addButton((btn) => {
				const hidden = !this.expandedBlocks['global']
				btn
					.setIcon(hidden ? 'eye' : 'eye-off')
					.onClick(() => {
						this.expandedBlocks['global'] = hidden
						this.display()
					})
			})
			.addButton((btn) => {
				btn
					.setIcon('save')
					.setCta()
					.onClick(() => {
						this.plugin.saveAll()
					})
			})

		if (this.expandedBlocks['global'])
			this.displayOrderedBlocks(this.settings, containerEl)

		const blocks = containerEl.createDiv()

		this.displayBlocks(blocks)
	}
}
