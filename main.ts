import {
	Editor,
	type EventRef,
	MarkdownView,
	Notice,
	Plugin,
	TFile
} from 'obsidian'
import { db } from 'src/assets/storage'
import { generateDynamicRegExp } from 'src/entities'
import { FileContent } from 'src/entities/file'
import { getFilesByPath } from 'src/lib/files'
import { LoggerConfirmModal } from 'src/lib/modal'
import { LoggerSetting } from 'src/settings'
import {
	DEFAULT_SETTINGS,
	ELoggerType,
	type ILoggerSettings
} from 'src/settings/types'
import { getItemsForBlockId } from 'src/settings/model'
import { api } from 'src/api'
import { getData } from 'src/api/data'
import { parseLog } from 'src/api/parseLog'

export default class LoggerPlugin extends Plugin {
	settings: ILoggerSettings
	lastSettings: ILoggerSettings
	tp: any
	createQueue: Set<string> = new Set()
	onModify: null | EventRef
	onDelete: null | EventRef
	regArr: (string | RegExp)[]
	api: any

	async onload() {
		const cssContent = await this.loadCSSFile(
			'src/assets/index.css'
		)
		this.injectCSS(cssContent)

		this.tp =
			// @ts-ignore
			this.app.plugins?.plugins['templater-obsidian']

		await this.loadSettings()
		this.getRegExprArr()
		this.api = api(this.app, this.settings, this.regArr)

		this.addCommand({
			id: 'daily-logger-show-list',
			name: 'Show list',
			editorCallback: async (
				editor: Editor,
				view: MarkdownView
			) => {
				await new LoggerConfirmModal(
					this.app,
					this.settings
				).open()

				//const block = this.settings.blocks.find(
				//	(b) => b.name === commandName
				//)
				//
				//const log =
				//	await this.getLogByBlockName(commandName)
				//
				//if (!log || !view.file || !block) return
				//
				//console.log(log, await this.parseLog(log))
				//
				//const content = await new FileContent(
				//	this.app,
				//	view.file
				//).init()
				//
				//const endLoc = content.getEndOfSectionByName(
				//	block.sectionName ||
				//		this.settings.global.sectionName
				//)
				//
				//if (!endLoc) return
				//
				//const position: EditorPosition = {
				//	line: endLoc.line,
				//	ch: endLoc.col
				//}
				//
				//editor.setSelection(position, position)
				//
				//editor.replaceSelection(`${log.trim()}\n`)
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new LoggerSetting(this.app, this))

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
				//console.log(`File deleted: ${file.path}`)
			}
		)
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

		this.getRegExprArr()
	}

	getRegExprArr() {
		const blocks = this.settings.blocks.filter(
			(block) => block.type === ELoggerType.LOGGER
		)

		const itemsArr = blocks.map((block) =>
			getItemsForBlockId(this.settings, block.id)
		)

		this.regArr = itemsArr.map((items) =>
			generateDynamicRegExp({
				items,
				deep: false,
				wrapToGroup: true,
				delimiter: this.settings.global.delimiter
			})
		)
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
		const paths = new Set(
			[this.settings.global.folderPath].concat(
				this.settings.blocks
					.map((block) => block.path)
					.filter((item) => !!item)
			)
		)
		const filesData = (
			await Promise.all(
				[...paths].map((path) => this.getDataByPath(path))
			)
		).flat()
		console.timeEnd()

		await db.createMany(filesData)
	}

	async getAllLogs() {
		console.time()
		const res = await getData(this.settings.blocks, () =>
			db.getAll()
		)
		console.timeEnd()
		return res
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

		const logs = lines
			.map((line) =>
				parseLog(this.settings, this.regArr, line)
			)
			.filter((log) => !!log)

		return logs.map((data) => ({
			path: file.name,
			...data
		}))
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
