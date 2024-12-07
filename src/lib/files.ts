import { App } from 'obsidian'

export const getFilesByPath = (app: App, path: string) => {
	return app.vault
		.getFiles()
		.filter(
			(file) =>
				file.path.startsWith(path) &&
				file.path.endsWith('.md')
		)
}
