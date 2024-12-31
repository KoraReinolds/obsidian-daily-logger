import LoggerPlugin from 'main'
import { App, PluginSettingTab, Setting } from 'obsidian'
import { mount } from 'svelte'
import Component from '../components/settings.svelte'
import { type ILoggerSettings } from './types'

export class LoggerSetting extends PluginSettingTab {
	plugin: LoggerPlugin
	settings: ILoggerSettings

	constructor(app: App, plugin: LoggerPlugin) {
		super(app, plugin)
		this.plugin = plugin
		this.settings = this.plugin.settings
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
				settings: this.plugin.settings,
				save: (settings: ILoggerSettings) => {
					this.plugin.settings = settings

					this.plugin.saveSettings()
				}
			}
		})
	}
}
