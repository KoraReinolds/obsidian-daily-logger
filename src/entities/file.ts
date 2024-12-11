import { App, Loc, SectionCache, TFile } from 'obsidian'

export class FileContent {
	_file: TFile
	_app: App
	_content = ''
	_sections: SectionCache[] = []
	_sectionNames: string[] = []

	constructor(app: App, file: TFile) {
		this._app = app
		this._file = file
	}

	async init() {
		this._content = await this.getContent()
		const metadata = this._app.metadataCache.getFileCache(
			this._file
		)
		this._sections = metadata?.sections || []
		this._sectionNames = this._sections.map((sec) => {
			const startIndex = sec.position.start.offset
			const endIndex = this._content.indexOf(
				'\n',
				startIndex
			)
			const substring = this._content.slice(
				startIndex,
				endIndex !== -1 ? endIndex : sec.position.end.offset
			)

			return substring
		})

		return this
	}

	async getContent() {
		return await this._app.vault.cachedRead(this._file)
	}

	_getSectionIndexByName(name: string) {
		return this._sectionNames.findIndex((str) =>
			str.includes(name)
		)
	}

	getEndOfSectionByName(name: string): Loc | undefined {
		const index = this._getSectionIndexByName(name)
		const section = this._sections[index + 1]

		if (!~index || !section) {
			return this._sections.at(-1)?.position.end
		}

		return section.position.start
	}

	getSectionContentByName(name: string) {
		const index = this._getSectionIndexByName(name)

		if (!~index) return

		const section = this._sections[index]

		const startIndex = section.position.start.offset
		const endLoc = this.getEndOfSectionByName(name)

		return this._content.slice(
			startIndex,
			endLoc?.offset || this._content.length
		)
	}
}
