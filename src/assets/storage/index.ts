import Dexie, { Table } from 'dexie'

interface LogData {
	path: string
	data: any
}

class LoggerStorage extends Dexie {
	data!: Table<LogData>

	constructor() {
		super('LoggerStorage')
		this.version(1).stores({
			data: '++id, path, data'
		})
	}

	async clear() {
		try {
			await this.data.clear()
		} catch (e) {
			console.error('Error during clear:', e)
		}
	}

	async createMany(data: LogData[]) {
		try {
			await this.data.bulkPut(data)
		} catch (e) {
			console.error('Error during create:', e)
			return []
		}
	}

	async getAll(): Promise<LogData[]> {
		try {
			return await this.data.toArray()
		} catch (e) {
			console.error('Error during get:', e)
			return []
		}
	}
}

export const db = new LoggerStorage()
