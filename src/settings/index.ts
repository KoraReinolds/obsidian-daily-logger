import MemoPlugin from '../../main'
import { App, PluginSettingTab, Setting } from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import LoggerPlugin from '../../main'
import {
	ILoggerSettings,
	TBlockType,
	TCustomBlock,
	TLoggerBlock
} from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	blocks: HTMLElement
	preview: { text: Setting; block: TLoggerBlock }[] = []
	globalPrefix = ''

	constructor(app: App, plugin: MemoPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
	}

	recalculateGlobalPrefix() {
		this.globalPrefix = this.settings.order
			.map((id) =>
				this.settings.blocks.find(
					(block) => block.id === id
				)
			)
			.filter((item) => !!item)
			.map((block) => block.value)
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
				.map((block) => block.value)
		].join(' ')
	}

	displayPreview() {
		this.recalculateGlobalPrefix()
		this.preview.forEach(({ text, block }) => {
			text.setName(this.calculateText(block))
		})
	}

	displayOrderedBlocks(
		params: {
			order: string[]
			blocks: TCustomBlock[]
		},
		containerEl: HTMLElement
	) {
		const { order, blocks } = params

		order.forEach((id, i) => {
			const item = blocks.find((item) => item.id === id)

			if (!item) return

			new Setting(containerEl)
				// .setName('')
				// .setDesc('')
				.addButton((btn) => {
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
				.addButton((btn) => {
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
				.addDropdown((dd) =>
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
				.addText((text) =>
					text
						.setPlaceholder('Type key')
						.setValue(item.name)
						.onChange(async (value) => {
							item.name = value
							await this.plugin.saveSettings()
						})
				)
				.addText((text) =>
					text
						.setPlaceholder('Type value')
						.setValue(item.value)
						.onChange(async (value) => {
							item.value = value
							await this.plugin.saveSettings()
							this.displayPreview()
						})
				)
				.addButton((btn) => {
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
				})
		})
	}

	displayBlocks(containerEl: HTMLElement) {
		containerEl.empty()
		this.preview = []

		const list = this.settings.loggerBlocks

		list.forEach((block) => {
			const id = block.id

			const header = new Setting(containerEl).setName(
				this.calculateText(block)
			)

			this.preview.push({ text: header, block })

			header.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					this.plugin.settings.loggerBlocks = list.filter(
						(item) => item.id !== id
					)

					this.plugin.saveSettings()
					this.display()
				})
			})

			header.addButton((btn) => {
				const hidden = !this.expandedBlocks[id]
				btn
					.setIcon(hidden ? 'eye' : 'eye-off')
					.onClick(() => {
						this.expandedBlocks[id] = hidden
						this.display()
					})
			})

			header.addButton((btn) => {
				btn.setIcon('plus').onClick(() => {
					const id = uuidv4()

					this.expandedBlocks[block.id] = true

					block.blocks.push({
						id,
						name: '',
						type: 'text',
						value: ''
					})
					block.order.push(id)
					this.plugin.saveSettings()
					this.display()
				})
			})

			if (!this.expandedBlocks[id]) return

			this.displayOrderedBlocks(block, containerEl)
		})
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		const list = this.settings.loggerBlocks
		this.recalculateGlobalPrefix()

		new Setting(containerEl)
			.setName('Global blocks')
			.setDesc('Define rules for each log msg')
			.addButton((btn) =>
				btn
					.setButtonText('Add new block')
					.onClick(async () => {
						list.push({
							id: uuidv4(),
							blocks: [],
							order: []
						})
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

		if (this.expandedBlocks['global'])
			this.displayOrderedBlocks(this.settings, containerEl)

		if (!this.blocks) this.blocks = containerEl.createDiv()

		this.containerEl.appendChild(this.blocks)
		this.displayBlocks(this.blocks)
	}
}
