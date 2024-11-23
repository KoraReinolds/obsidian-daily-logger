import {
	App,
	Editor,
	FuzzyMatch,
	FuzzySuggestModal,
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	TFolder
} from 'obsidian'
import {
	generateDynamicRegExp,
	itemData
} from 'src/entities'
import { LoggerSetting } from 'src/settings'
import {
	DEFAULT_SETTINGS,
	EItemType,
	ELoggerType,
	ILoggerSettings,
	TItem
} from 'src/settings/types'

export default class LoggerPlugin extends Plugin {
	settings: ILoggerSettings
	lastSettings: ILoggerSettings
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
				//
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
						//
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
		const loadData = await this.loadData()

		const { settings, lastSettings } = Object.assign(
			{},
			{
				settings: this.getSettingsCopy(DEFAULT_SETTINGS),
				lastSettings: this.getSettingsCopy(DEFAULT_SETTINGS)
			},
			loadData
		)

		this.settings = settings
		this.lastSettings = lastSettings
	}

	async clearData() {
		this.settings = Object.assign(
			{},
			JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
		)
		this.saveSettings()
	}

	getSettingsCopy(settings: ILoggerSettings) {
		const settingsCopy = {
			...settings,
			blocks: settings.blocks.map((block) => {
				const blockCopy = { ...block }
				delete blockCopy.headerEl

				return blockCopy
			}),
			items: Object.fromEntries(
				Object.entries(settings.items).map(([key, val]) => {
					const copyVal = { ...val }
					delete copyVal.el

					return [key, copyVal]
				})
			)
		}
		return JSON.parse(JSON.stringify(settingsCopy))
	}

	async saveSettings() {
		console.log(this.settings, this.lastSettings)
		await this.saveData({
			settings: this.getSettingsCopy(this.settings),
			lastSettings: this.getSettingsCopy(this.lastSettings)
		})
	}

	async clearChanges() {
		this.settings = this.getSettingsCopy(this.lastSettings)
		this.lastSettings = this.getSettingsCopy(
			this.lastSettings
		)
		await this.saveSettings()
	}

	async saveAll() {
		this.lastSettings = this.getSettingsCopy(this.settings)
		await this.saveSettings()

		const commands = (this.app as any).commands as any

		const pluginCommands = Object.keys(
			commands.commands
		).filter((commandId) =>
			commandId.startsWith('obsidian-daily-logger')
		)

		pluginCommands.forEach((id) =>
			commands.removeCommand(id)
		)

		this.settings.blocks
			.filter((block) => block.type === ELoggerType.LOGGER)
			.forEach((block) =>
				this.addCommand({
					id: block.id,
					name: block.name,
					editorCallback: async (editor: Editor) => {
						const log = (
							await Promise.all(
								(
									await this.getItemsFromBlock(block.id)
								).map((item) =>
									itemData[
										item.type as keyof typeof EItemType
									].toValue(item)
								)
							)
						).join(' ')

						console.log(await this.parseLog(log))

						console.log(
							await new FindOrCreateNoteModal(
								this.app,
								'Tasks'
							).open()
						)

						//// Установка базовой папки в Quick Switcher
						//quickSwitcher.instance.openQuickSwitcher(
						//	basePath
						//)
						//
						//console.log(
						//	`Открыто окно Find or Create Note для папки: ${basePath}`
						//)
						//
						//editor.replaceSelection(log)
					}
				})
			)

		new Notice('Successful save')
	}

	async getItemsFromBlock(
		blockId?: string
	): Promise<TItem[]> {
		const block = this.settings.blocks.find(
			(block) => block.id === blockId
		)

		if (!block) return []

		const items = await Promise.all(
			block.order
				.map((id) => {
					return this.settings.items[id]
				})
				.filter((item) => !!item)
				.map((item) => {
					if (EItemType[item.type as EItemType]) {
						return [item]
					} else {
						return this.getItemsFromBlock(item.type)
					}
				})
		)

		return items.flat()
	}

	async parseLog(log: string) {
		const blocks = this.settings.blocks.filter(
			(block) => block.type === ELoggerType.LOGGER
		)

		const itemsArr = await Promise.all(
			blocks.map((block) =>
				this.getItemsFromBlock(block.id)
			)
		)

		const regArr = await Promise.all(
			itemsArr.map((items) => generateDynamicRegExp(items))
		)

		const matchArr = regArr.map((reg) => log.match(reg))

		const firstMatch = matchArr.findIndex(
			(match) => !!match
		)

		if (firstMatch < 0) return {}

		const res = itemsArr[firstMatch].reduce(
			(r, item, i) => {
				const value = matchArr[firstMatch]?.[i + 1] || ''
				r[item.name] = value

				return r
			},
			{} as Record<string, string>
		)

		console.log(res)

		return res
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

	async suggestFleByPath(
		path: string
	): Promise<TFile | undefined> {
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

class FindOrCreateNoteModal extends FuzzySuggestModal<string> {
	private folderPath: string
	resolve: (value: string) => void
	reject: (reason?: any) => void

	constructor(app: App, folderPath: string) {
		super(app)
		this.folderPath = folderPath
		this.setPlaceholder('Введите название файла...')
	}

	open(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
			super.open()
		})
	}

	getSuggestions(query: string): FuzzyMatch<string>[] {
		const data = super.getSuggestions(query)

		if (!data.length) {
			return [
				{
					item: `New File: ${query}`,
					match: {
						score: 1,
						matches: []
					}
				}
			]
		}

		return data
	}

	getItems(): string[] {
		return this.app.vault
			.getFiles()
			.filter((file) =>
				file.path.startsWith(this.folderPath)
			)
			.map((file) =>
				file.path.replace(this.folderPath + '/', '')
			)
	}

	getItemText(item: string): string {
		return item
	}

	async onChooseItem(item: string) {
		if (item.startsWith('New File: ')) {
			const newFileName = this.inputEl.value
				.trim()
				.replace('New File: ', '')
			if (newFileName) {
				const newFilePath = `${this.folderPath}/${newFileName}`
				if (
					!this.app.vault.getAbstractFileByPath(newFilePath)
				) {
					const templater = (this.app as any).plugins
						.plugins['templater-obsidian']

					const templates: {
						folder: string
						template: string
					}[] = templater.settings.folder_templates

					console.log(this.folderPath)
					const template = templates.find(
						(t) => t.folder === this.folderPath
					)?.template

					if (templater && template) {
						const tp =
							templater.templater[
								'current_functions_object'
							]

						await tp.file.create_new(
							await tp.file.find_tfile(template),
							newFilePath,
							true,
							this.folderPath
						)
					} else {
						await this.app.vault.create(newFilePath, '')
					}
				}
				this.resolve(`[[${newFileName}]]`)
			}
		} else {
			this.resolve(`[[${item}]]`)
		}
	}
}
