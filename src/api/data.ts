import type { LogData } from 'src/assets/storage'
import type { TBlock } from 'src/settings/types'

export const getData = async (
	blocks: TBlock[],
	f: () => Promise<LogData[]>
) => {
	const blocksMeta = Object.fromEntries(
		blocks.map((block) => {
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
