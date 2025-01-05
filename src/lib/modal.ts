import {
	FuzzySuggestModal,
	App,
	type FuzzyMatch,
	Modal,
	ButtonComponent,
	Setting
} from 'obsidian'
import { getFilesByPath } from './files'
import {
	ELoggerType,
	type ILoggerSettings
} from 'src/settings/types'

export class LoggerConfirmModal extends Modal {
	private resolve: (value: any) => void
	private settings: ILoggerSettings
	list: string[]
	blockType: string

	constructor(app: App, settings: ILoggerSettings) {
		super(app)
		this.settings = settings
		this.list = settings.blocks
			.filter((block) => block.type === ELoggerType.LOGGER)
			.map((block) => block.name)
		this.blockType = this.list[0]
	}

	open(): Promise<boolean> {
		return new Promise((resolve) => {
			this.resolve = resolve
			super.open()
		})
	}

	onOpen() {
		const { contentEl } = this

		new Setting(contentEl)
			.setName('Type')
			.addDropdown((dd) => {
				dd.addOptions(
					Object.fromEntries(
						this.list.map((item) => [item, item])
					)
				)
					.setValue(this.blockType)
					.onChange((value) => {
						this.blockType = value
					})
			})

		const buttonContainer = contentEl.createDiv({
			cls: 'modal-buttons'
		})

		new ButtonComponent(buttonContainer)
			.setButtonText('OK')
			.setCta()
			.onClick(() => {
				this.resolve(this.blockType)
				this.close()
			})

		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => {
				this.resolve(false)
				this.close()
			})
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

export class LoggerListModal extends FuzzySuggestModal<string> {
	_list: string[]
	resolve: (value: string) => void
	reject: (reason?: any) => void

	constructor(app: App, list: string[]) {
		super(app)
		this.setPlaceholder('Input logger name...')
		this._list = list
	}

	open(): Promise<string> {
		return new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
			super.open()
		})
	}

	getItems(): string[] {
		return this._list
	}

	getItemText(item: string): string {
		return item
	}

	async onChooseItem(item: string) {
		return this.resolve(item)
	}
}

export class FindOrCreateNoteModal extends FuzzySuggestModal<string> {
	private folderPath: string
	resolve: (value: string) => void
	reject: (reason?: any) => void

	constructor(app: App, folderPath: string) {
		super(app)
		this.folderPath = folderPath
		this.setPlaceholder('Input file name...')
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
		return getFilesByPath(this.app, this.folderPath)
			.map((file) =>
				file.path.replace(this.folderPath + '/', '')
			)
			.map((path) => path.replace('.md', ''))
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
