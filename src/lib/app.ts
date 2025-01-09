import { App, TFile, TFolder } from 'obsidian'

export const isFile = (file: any): file is TFile => {
	return file instanceof TFile
}

export const isFolder = (file: any): file is TFolder => {
	return file instanceof TFolder
}

export const getFolderByPath = async (
	app: App,
	path: string
): Promise<TFolder | null> => {
	const folder = app.vault.getAbstractFileByPath(path)
	if (isFolder(folder)) return folder
	return null
}
