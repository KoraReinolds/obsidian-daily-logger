import {
	Editor,
	type EditorPosition,
	type EventRef,
	MarkdownView,
	Notice,
	Plugin,
	TFile,
	TFolder
} from 'obsidian'
import { db, type LogData } from 'src/assets/storage'
import {
	generateDynamicRegExp,
	generateTemplate,
	itemData
} from 'src/entities'
import { FileContent } from 'src/entities/file'
import { getFilesByPath } from 'src/lib/files'
import { LoggerListModal } from 'src/lib/fuzzyModal'
import { isItemMatched } from 'src/lib/match'
import { LoggerSetting } from 'src/settings'
import {
	DEFAULT_SETTINGS,
	EItemType,
	ELoggerType,
	type ILoggerSettings,
	type TBlock,
	type TItem
} from 'src/settings/types'

export default class LoggerPlugin extends Plugin {
	settings: ILoggerSettings
	lastSettings: ILoggerSettings
	tp: any
	createQueue: Set<string> = new Set()
	onModify: null | EventRef
	onDelete: null | EventRef
	api = {
		logByName: async (
			params: {
				name: string
				data: Record<string, string>
			}[]
		) => {
			const dataWithBlocks = params.map((data) => {
				const block = this.settings.blocks.find(
					(b) => b.name === data.name
				)
				return {
					...data,
					sectionName:
						block?.sectionName ||
						this.settings.global.sectionName
				}
			})
			// @ts-ignore
			const grouped = Object.groupBy(
				dataWithBlocks,
				({ sectionName }) => sectionName
			)
			const delay = (ms: number) =>
				new Promise((resolve) => setTimeout(resolve, ms))

			for (const entry of Object.entries(grouped)) {
				const [sectionName, data]: any = entry
				await this.logByName(sectionName, data)
				await delay(500)
			}
		},
		getBy: async (data: any) => {
			const metaData = Object.fromEntries(
				Object.entries(data).filter(([key]) =>
					key.startsWith('meta.')
				)
			)
			return (
				await this.getData(() => db.getBy(data))
			).filter((item) => isItemMatched(metaData, item))
		},
		pick: (item: any, data: any) => {
			const entries = Object.entries(data).map(
				([key, val]: any) => {
					const keys = val.split('.')
					let value: any = item

					while (value && keys.length) {
						const key = keys.shift()
						if (key) value = value[key]
					}

					if (value !== undefined) return [key, value]

					return [key, '']
				}
			)

			return Object.fromEntries(entries)
		}
	}

	async logByName(
		sectionName: string,
		params: {
			name: string
			data: Record<string, string>
		}[]
	) {
		// @ts-ignore
		const grouped = Object.groupBy(
			params,
			(item: any) => item.name
		)

		const mappedTemplates = await Promise.all(
			Object.entries(grouped)
				.map(([name, data]) => {
					const dataArr = (data as any).map((d) => d.data)
					const block = this.settings.blocks.find(
						(b) => b.name === name
					)
					if (!block) return null
					return [block, dataArr]
				})
				.filter((item) => !!item)
				.map(async (params) => {
					const block: TBlock = params[0] as never as TBlock
					const dataArr = params[1]

					const items = await this.getItemsForBlockId(
						block.id
					)
					const template = await generateTemplate({
						items,
						wrapToGroup: true
					})
					return [template, dataArr]
				})
		)

		const logs = mappedTemplates.reduce((res, cur) => {
			const template = cur[0] as string
			const dataArr = cur[1] as Record<string, string>[]

			const logs = dataArr.map((data) => {
				const log = template.replace(
					/{(\w+)}/g,
					(_, key) => {
						return key in data ? data[key] : `{${key}}`
					}
				)

				console.log(template, data, log)
				return log
			})
			return res.concat(logs)
		}, [])

		const folderPath = 'Journal/Daily'
		const dateFormat = 'YYYY-MM-DD'
		// @ts-ignore
		const todayDate = moment().format(dateFormat)
		const filePath = `${folderPath}/${todayDate}.md`
		const file =
			this.app.vault.getAbstractFileByPath(filePath)

		if (file instanceof TFile) {
			const fileContent = await new FileContent(
				this.app,
				file
			).init()

			const endLoc =
				fileContent.getEndOfSectionByName(sectionName)

			if (!endLoc) return

			const content = fileContent._content
			const lines = content.split('\n')
			lines.splice(endLoc.line, 0, logs.join('\n'))
			const updatedContent = lines.join('\n')
			await this.app.vault.modify(file, updatedContent)
		}
	}

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
			() => {
				// Called when the user clicks the icon.
				new Notice('This is a notice!')
			}
		)
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class')

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem()
		//statusBarItemEl.setText('Status Bar Text')

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: async () => {
				//const file =
				//	this.app.vault.getAbstractFileByPath(
				//		[
				//			this.settings.global.folderPath,
				//			'2024-12-06.md'
				//		].join('/')
				//	)
				//
				//if (file instanceof TFile) {
				//	console.log(file, await this.parseFile(file))
				//}
				console.log(await this.getAllLogs())
				//console.log(await this.parseLog(''))
			}
		})

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor) => {
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

		this.addCommand({
			id: 'daily-logger-show-list',
			name: 'Show list',
			editorCallback: async (
				editor: Editor,
				view: MarkdownView
			) => {
				const list = this.settings.blocks
					.filter(
						(block) => block.type === ELoggerType.LOGGER
					)
					.map((block) => block.name)

				const commandName = await new LoggerListModal(
					this.app,
					list
				).open()

				const block = this.settings.blocks.find(
					(b) => b.name === commandName
				)

				const log =
					await this.getLogByBlockName(commandName)

				if (!log || !view.file || !block) return

				console.log(log, await this.parseLog(log))

				const content = await new FileContent(
					this.app,
					view.file
				).init()

				const endLoc = content.getEndOfSectionByName(
					block.sectionName ||
						this.settings.global.sectionName
				)

				if (!endLoc) return

				const position: EditorPosition = {
					line: endLoc.line,
					ch: endLoc.col
				}

				editor.setSelection(position, position)

				editor.replaceSelection(`${log.trim()}\n`)
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LoggerSetting(this.app, this))

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', () => {})

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(
				() => console.log('setInterval'),
				5 * 60 * 1000
			)
		)

		this.onModify = this.app.vault.on(
			'modify',
			async (file) => {
				if (!this.createQueue) return

				const isFileCreating = this.createQueue.has(
					file.name
				)

				if (isFileCreating) return
				else {
					this.createQueue.add(file.name)

					setTimeout(async () => {
						await db.removeFileData(file.name)

						const data = await this.getDataByPath(file.path)
						await db.createMany(data)

						this.createQueue.delete(file.name)
						console.log(
							`File modified: ${file.name} with `,
							data
						)
					}, 2000)
				}
			}
		)

		this.onDelete = this.app.vault.on(
			'delete',
			async (file) => {
				await db.removeFileData(file.path)
				console.log(`File deleted: ${file.path}`)
			}
		)
	}

	async getLogByBlockName(blockName: string) {
		const block = this.settings.blocks.find(
			(block) => block.name === blockName
		)

		if (!block) return

		const log = await this.getLogFromBlock(
			block.id,
			this.settings.global.delimiter
		)

		return log
	}

	onunload() {
		if (this.onModify) this.app.vault.offref(this.onModify)
		if (this.onDelete) this.app.vault.offref(this.onDelete)
	}

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

				return blockCopy
			}),
			items: Object.fromEntries(
				Object.entries(settings.items).map(([key, val]) => {
					const copyVal = { ...val }

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

		await this.saveAllLogs()
		console.log(await this.getAllLogs())

		new Notice('Successful save')
	}

	async getDataByPath(path: string) {
		const files = getFilesByPath(this.app, path)
		const filesData = (
			await Promise.all(
				files.map((file) => {
					if (file instanceof TFile) {
						return this.parseFile(file)
					}
					return []
				})
			)
		)
			.filter((data) => !!data.length)
			.flat()

		return filesData
	}

	async saveAllLogs() {
		await db.clear()

		console.time()
		const filesData = await this.getDataByPath(
			this.settings.global.folderPath
		)
		console.timeEnd()

		await db.createMany(filesData)
	}

	async getData(f: () => Promise<LogData[]>) {
		const blocksMeta = Object.fromEntries(
			this.settings.blocks.map((block) => {
				const meta = Object.fromEntries(
					block.meta.map((b) => [b.key, b.value])
				)
				return [block.id, meta]
			})
		)
		return (await f()).map((data) => {
			return {
				path: data.path,
				data: data.data,
				meta: blocksMeta[data.blockId]
			}
		})
	}

	async getAllLogs() {
		console.time()
		const res = await this.getData(() => db.getAll())
		console.timeEnd()
		return res
	}

	async getLogFromBlock(
		blockId: string,
		delimiter = ''
	): Promise<string> {
		const items = await this.getItemsFromBlock(blockId)
		const values = await Promise.all(
			items.map((item) => {
				const data =
					itemData[item.type as keyof typeof EItemType]
				if (data) {
					return data.toValue(item)
				} else {
					return this.getLogFromBlock(
						item.type,
						item.delimiter
					)
				}
			})
		)

		return values.join(delimiter)
	}

	async getItemsFromBlock(
		blockId?: string,
		deep?: boolean
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
						return deep
							? this.getItemsFromBlock(item.type)
							: [item]
					}
				})
		)

		return items.flat()
	}

	getDataFromItems(
		items: TItem[],
		matches: RegExpMatchArray,
		i = 0
	) {
		const itemsData = items.reduce(
			(r, item, index) => {
				if (item.isOptional && index > 0) i += 1
				if (item.name) {
					if (item.nested?.length) {
						const { index, itemsData } =
							this.getDataFromItems(item.nested, matches, i)
						r[item.name] = itemsData
						i = index
					} else {
						r[item.name] = (matches[i] || '').trim()
						i += 1
					}
				}
				return r
			},
			{} as Record<string, any>
		)

		return {
			index: i,
			itemsData
		}
	}

	async getItemsForBlockId(id: string): Promise<any> {
		const items = await this.getItemsFromBlock(id)

		return (
			await Promise.all(
				items.map((item) => {
					if (itemData[item.type as EItemType]) {
						return item
					} else {
						return this.getItemsForBlockId(item.type)
					}
				})
			)
		).map((res, i) => {
			return Array.isArray(res)
				? {
						...items[i],
						nested: res
					}
				: res
		})
	}

	async parseFile(file: TFile) {
		const content = await new FileContent(
			this.app,
			file
		).init()

		// NOTE: unoptimize way to get data
		const sectionContent = content._content
		//const sectionContent = content.getSectionContentByName(
		//	this.settings.global.sectionName
		//)

		if (!sectionContent) return []

		const lines = sectionContent.split('\n')

		const logs = (
			await Promise.all(
				lines.map((line) => this.parseLog(line))
			)
		).filter((log) => !!log)

		return logs.map((data) => ({
			path: file.name,
			...data
		}))
	}

	async parseLog(log: string): Promise<{
		blockId: string
		data: Record<string, string>
	} | null> {
		const blocks = this.settings.blocks.filter(
			(block) => block.type === ELoggerType.LOGGER
		)

		const itemsArr = await Promise.all(
			blocks.map((block) =>
				this.getItemsForBlockId(block.id)
			)
		)

		const regArr = await Promise.all(
			itemsArr.map((items) =>
				generateDynamicRegExp({
					items,
					deep: false,
					wrapToGroup: true,
					delimiter: this.settings.global.delimiter
				})
			)
		)

		let firstMatch = -1
		let matches: RegExpMatchArray | null = null

		regArr.forEach((reg, i) => {
			const match = log.match(reg)
			if (match) {
				firstMatch = i
				matches = match
				return null
			}
		})

		if (firstMatch < 0 || !matches) {
			if (log.startsWith('>>')) {
				console.log(log)
			}
			return null
		}

		const res = this.getDataFromItems(
			itemsArr[firstMatch],
			matches,
			1
		).itemsData

		return {
			blockId: blocks[firstMatch].id,
			data: res
		}
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
