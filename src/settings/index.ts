import LoggerPlugin from 'main'
import { App, PluginSettingTab, Setting } from 'obsidian'
import { mount } from 'svelte'
import Component from '../components/settings.svelte'
import General from '../components/settingsGeneral.svelte'
import Blocks from '../components/settingsBlocks.svelte'
import {
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
				component: General
			},
			{
				name: 'Logs',
				type: ELoggerType.LOGGER,
				component: Blocks,
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
				component: Blocks,
				data: {
					settings: {
						header: {
							btnText: 'Add New Template'
						}
					}
				}
			}
		]
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

		mount(Component, {
			target: containerEl,
			props: {
				tabs: this.tabs,
				settings: this.settings,
				save: (settings: ILoggerSettings) => {
					this.plugin.settings = settings
					this.plugin.saveSettings()
				}
			}
		})
	}
}
