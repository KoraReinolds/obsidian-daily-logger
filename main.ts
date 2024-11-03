import {
	App,
	Editor,
	Modal,
	Notice,
	Plugin,
	TFile,
	TFolder
} from 'obsidian'
import { LoggerSetting } from 'src/settings'
import {
	DEFAULT_SETTINGS,
	ILoggerSettings,
	TCustomBlock
} from 'src/settings/types'

export default class LoggerPlugin extends Plugin {
	settings: ILoggerSettings
	tp: any

	async onload() {
		const cssContent = await this.loadCSSFile(
			'src/assets/index.css'
		)
		this.injectCSS(cssContent)

		this.tp =
			// @ts-ignore
			this.app.plugins?.plugins['templater-obsidian']

		await this.loadSettings()

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			'dice',
			'Sample Plugin',
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice('This is a notice!')
			}
		)
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class')

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem()
		statusBarItemEl.setText('Status Bar Text')

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open()
			}
		})
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (
				editor: Editor,
				view: MarkdownView
			) => {
				console.log(editor.getSelection())
				editor.replaceSelection('Sample Editor Command')
			}
		})
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(
						MarkdownView
					)
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open()
					}

					// This command will only show up in Command Palette when the check function returns true
					return true
				}
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LoggerSetting(this.app, this))

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(
			document,
			'click',
			(evt: MouseEvent) => {}
		)

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(
				() => console.log('setInterval'),
				5 * 60 * 1000
			)
		)

		this.saveAll()
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		)
	}

	async saveSettings() {
		console.log(this.settings)
		await this.saveData(this.settings)
	}

	saveAll() {
		const commands = (this.app as any).commands as any

		const pluginCommands = Object.keys(
			commands.commands
		).filter((commandId) =>
			commandId.startsWith('obsidian-daily-logger')
		)

		pluginCommands.forEach((id) =>
			commands.removeCommand(id)
		)

		this.settings.loggerBlocks.forEach((block) =>
			this.addCommand({
				id: block.id,
				name: block.name,
				editorCallback: async (editor: Editor) => {
					const loggerBlock =
						this.settings.loggerBlocks.find(
							(item) => item.name === block.name
						)

					const globalLog = await this.blocksToLog(
						this.settings
					)

					const localLog = loggerBlock
						? await this.blocksToLog(loggerBlock)
						: ''
					const log = [globalLog, localLog]
						.filter((item) => !!item)
						.join(' ')

					this.parseLog(log)

					editor.replaceSelection(log)
				}
			})
		)

		new Notice('Successful save')
	}

	async blocksToLog(params: {
		blocks: TCustomBlock[]
		order: string[]
	}) {
		const { blocks, order } = params
		const log = await Promise.all(
			order.map((id) => {
				const block = blocks.find(
					(block) => block.id === id
				)
				if (!block) return ''

				switch (block.type) {
					case 'text':
					case 'key':
						return block.value
					case 'time':
						// @ts-ignore
						return moment().format(block.value)
					case 'link':
						return new Promise((res) =>
							this.suggestFileByPath(block.value).then(
								(file) => res(`[[${file.basename}]]`)
							)
						)
					default:
						break
				}
			})
		)

		return (await Promise.all(log)).join(' ')
	}

	parseLog(log: string) {
		console.log(log)
	}

	isFile(file: any): file is TFile {
		return file instanceof TFile
	}

	isFolder(file: any): file is TFolder {
		return file instanceof TFolder
	}

	async getFolderByPath(
		path: string
	): Promise<TFolder | null> {
		const folder =
			this.app.vault.getAbstractFileByPath(path)
		if (this.isFolder(folder)) return folder
		return null
	}

	async suggestFleByPath(path: string): Promise<TFile> {
		const file = await this.getFolderByPath(path)
		if (this.isFolder(file)) {
			const files = file.children.filter((f) =>
				this.isFile(f)
			)
			// @ts-ignore
			files.sort((a, b) => b.stat.mtime - a.stat.mtime)

			// @ts-ignore
			return await this.tp.templater.current_functions_object.system.suggester(
				(file: TFile) => file.name,
				files
			)
		} else {
			new Notice(`Can't find '${path}' folder`)
		}
	}

	async loadCSSFile(filename: string): Promise<string> {
		const path = `${this.manifest.dir}/${filename}`
		const data = await this.app.vault.adapter.read(path)
		return data
	}

	injectCSS(cssContent: string) {
		const style = document.createElement('style')
		style.type = 'text/css'
		style.id = `plugin-styles-${this.manifest.id}`
		document
			.querySelectorAll(`#${style.id}`)
			.forEach((style) => style.remove())
		style.innerHTML = cssContent
		document.head.appendChild(style)
	}

	removeInjectedCSS() {
		const id = `plugin-styles-${this.manifest.id}`
		const style = document.getElementById(id)
		if (style) {
			style.remove()
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app)
	}

	onOpen() {
		const { contentEl } = this
		contentEl.setText('Woah!')
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}
