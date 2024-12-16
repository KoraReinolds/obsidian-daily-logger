import Dexie, { type Table } from 'dexie'

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
		data: Record<string, string>
	): Promise<LogData[]> {
		try {
			const isItemMatched = (item: LogData) => {
				return Object.entries(data).every(([key, val]) => {
					const keys = key.split('.')
					let value: any = item

					if (value === val) return true

					while (value && keys.length) {
						const key = keys.shift()
						if (key) value = value[key]

						if (value === val) return true
					}

					return false
				})
			}

			return this.data.filter(isItemMatched).toArray()
		} catch (e) {
			console.error(`Error during ${this.getBy.name}:`, e)
			return []
		}
	}
}

export const db = new LoggerStorage()
