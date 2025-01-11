import { getDataFromItems } from 'src/entities'
import { getItemsForBlockId } from 'src/settings/model'
import {
	ELoggerType,
	type ILoggerSettings
} from 'src/settings/types'

export const parseLog = (
	settings: ILoggerSettings,
	regArr: (string | RegExp)[],
	log: string
): {
	blockId: string
	data: Record<string, string>
} | null => {
	const blocks = settings.blocks.filter(
		(block) => block.type === ELoggerType.LOGGER
	)

	const itemsArr = blocks.map((block) =>
		getItemsForBlockId(settings, block.id)
	)

	let firstMatch = -1
	let matches: RegExpMatchArray | null = null

	regArr.forEach((reg, i) => {
		const match = log.match(reg)
		if (match) {
			firstMatch = i
			matches = match
			return null
		}
	})

	if (firstMatch < 0 || !matches) {
		if (log.startsWith('>>')) {
			console.log(log)
		}
		return null
	}

	const res = getDataFromItems(
		itemsArr[firstMatch],
		matches,
		1
	).itemsData

	return {
		blockId: blocks[firstMatch].id,
		data: res
	}
}
