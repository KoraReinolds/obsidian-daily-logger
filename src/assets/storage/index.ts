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
}

const db = new LoggerStorage()

export const createMany = async (data: LogData[]) => {
	try {
		await db.data.bulkPut(data)
	} catch (e) {
		console.error('Error during create:', e)
		return []
	}
}

export const getAll = async (): Promise<LogData[]> => {
	try {
		return await db.data.toArray()
	} catch (e) {
		console.error('Error during get:', e)
		return []
	}
}
