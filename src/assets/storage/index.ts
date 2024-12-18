import Dexie, { type Table } from 'dexie'
import { isItemMatched } from 'src/lib/match'

export interface LogData {
	path: string
	blockId: string
	data: any
}

class LoggerStorage extends Dexie {
	data!: Table<LogData>

	constructor() {
		super('LoggerStorage')
		this.version(1).stores({
			data: '++id, path, data, blockId'
		})
	}

	async clear() {
		try {
			await this.data.clear()
		} catch (e) {
			console.error(`Error during ${this.clear.name}:`, e)
		}
	}

	async removeFileData(filePath: string) {
		try {
			await this.data
				.where('path')
				.equals(filePath)
				.delete()
		} catch (e) {
			console.error(
				`Error during ${this.removeFileData.name}:`,
				e
			)
			return []
		}
	}

	async createMany(data: LogData[]) {
		try {
			await this.data.bulkPut(data)
		} catch (e) {
			console.error(
				`Error during ${this.createMany.name}:`,
				e
			)
			return []
		}
	}

	async getAll(): Promise<LogData[]> {
		try {
			return await this.data.toArray()
		} catch (e) {
			console.error(`Error during ${this.getAll.name}:`, e)
			return []
		}
	}

	async getBy(
		data: Record<string, string | string[]>
	): Promise<LogData[]> {
		try {
			const dataWithoutMeta = Object.fromEntries(
				Object.entries(data).filter(
					([key]) => !key.startsWith('meta.')
				)
			)

			return this.data
				.filter((item) =>
					isItemMatched(dataWithoutMeta, item)
				)
				.toArray()
		} catch (e) {
			console.error(`Error during ${this.getBy.name}:`, e)
			return []
		}
	}
}

export const db = new LoggerStorage()
