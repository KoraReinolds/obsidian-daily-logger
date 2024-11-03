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

	addNewBlock(params: Partial<TCustomBlock> = {}) {
		const id = uuidv4()

		this.settings.blocks[id] = {
			id: id,
			type: 'text',
			name: '',
			value: '',
			...params
		}

		return id
	}

	addNewLog() {
		const id = uuidv4()
		const name = 'New log'
		const keyId = this.addNewBlock({
			type: 'key',
			name: 'key'
		})

		this.settings.loggerBlocks.push({
			id,
			name,
			order: [keyId]
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
		//this.globalPrefix = this.settings.order
		//	.map((id) =>
		//		this.settings.blocks.find(
		//			(block) => block.id === id
		//		)
		//	)
		//	.filter((item) => !!item)
		//	.map((block) => block?.value)
		//	.join(' ')
	}

	calculateText(block: TLoggerBlock) {
		return [
			this.globalPrefix,
			...block.order
				.map((id) => this.settings.blocks[id])
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
		const blocks = this.settings.blocks

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
					delete this.settings.blocks[id]

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

				this.settings.blocks[id] = {
					name: '',
					type: 'text',
					value: '',
					...newBlock,
					id
				}
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
						(id) => delete this.settings.blocks[id]
					)

					this.settings.loggerBlocks = list.filter(
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

		const logsContent = containerEl.createDiv()

		logsContent.classList.add('daily-logger-blocks')

		new Setting(logsContent).addButton((btn) =>
			btn.setButtonText('Add New Log').onClick(() => {
				this.addNewLog()
				this.display()
			})
		)

		const blocks = logsContent.createDiv()

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
							//blocks: [
							//	{
							//		id: blockId,
							//		name: '',
							//		type: 'key',
							//		value: ''
							//	}
							//],
							order: [blockId]
						})
						this.plugin.saveSettings()
						this.display()
					})
			)
			//.addButton((btn) =>
			//	btn.setIcon('plus').onClick(async () => {
			//		const id = uuidv4()
			//		this.expandedBlocks['global'] = true
			//
			//		this.settings.blocks[id] = {
			//			id,
			//			name: '',
			//			type: 'text',
			//			value: ''
			//		}
			//		this.settings.order.push(id)
			//		this.plugin.saveSettings()
			//		this.display()
			//	})
			//)
			//.addButton((btn) => {
			//	const hidden = !this.expandedBlocks['global']
			//	btn
			//		.setIcon(hidden ? 'eye' : 'eye-off')
			//		.onClick(() => {
			//			this.expandedBlocks['global'] = hidden
			//			this.display()
			//		})
			//})
			.addButton((btn) => {
				btn
					.setIcon('save')
					.setCta()
					.onClick(() => {
						this.plugin.saveAll()
					})
			})

		//if (this.expandedBlocks['global'])
		//	this.displayOrderedBlocks(this.settings, containerEl)

		const blocks = containerEl.createDiv()

		this.displayBlocks(blocks)
	}
}
