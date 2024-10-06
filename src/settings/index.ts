import MemoPlugin from '../../main'
import {
	App,
	PluginSettingTab,
	Setting,
	TextComponent
} from 'obsidian'
import { v4 as uuidv4 } from 'uuid'
import LoggerPlugin from '../../main'
import {
	ILoggerSettings,
	TBlockType,
	TLoggerBlock
} from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings
	expandedBlocks: Record<string, boolean> = {}
	blocks: HTMLElement

	constructor(app: App, plugin: MemoPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
	}

	calculateText(block: TLoggerBlock) {
		return [
			this.settings.prefix,
			...block.blocks.map((block) => block.value)
		].join(' ')
	}

	displayBlocks(containerEl: HTMLElement) {
		containerEl.empty()

		const list = this.settings.loggerBlocks

		list.forEach((block) => {
			const id = block.id

			const header = new Setting(containerEl).setName(
				'Block name'
			)
			let headerText: TextComponent

			header.addText((text) => {
				headerText = text
				return text
					.setValue(this.calculateText(block))
					.setDisabled(true)
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
				btn.setIcon('trash-2').onClick(() => {
					this.plugin.settings.loggerBlocks = list.filter(
						(item) => item.id !== id
					)

					this.plugin.saveSettings()
					this.display()
				})
			})

			if (!this.expandedBlocks[id]) return

			block.order.forEach((id) => {
				const item = block.blocks.find(
					(item) => item.id === id
				)

				if (!item) return

				new Setting(containerEl)
					// .setName('')
					// .setDesc('')

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
								headerText.setValue(
									this.calculateText(block)
								)
							})
					)
					.addButton((btn) => {
						btn.setIcon('trash-2').onClick(() => {
							block.blocks = block.blocks.filter(
								(item) => item.id !== id
							)
							block.order = block.order.filter(
								(blockId) => blockId !== id
							)

							this.plugin.saveSettings()
							this.display()
						})
					})
			})
		})
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		const list = this.settings.loggerBlocks

		new Setting(containerEl)
			.setName('Global prefix')
			.setDesc('Prefix for each log')
			.addText((text) =>
				text
					.setPlaceholder('Type prefix')
					.setValue(this.settings.prefix)
					.onChange(async (value) => {
						this.plugin.settings.prefix = value
						await this.plugin.saveSettings()
						this.displayBlocks(this.blocks)
					})
			)
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

		if (!this.blocks) this.blocks = containerEl.createDiv()

		this.containerEl.appendChild(this.blocks)
		this.displayBlocks(this.blocks)
	}
}
