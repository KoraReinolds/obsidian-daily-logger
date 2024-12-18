const isValuesMatch = (v1: any, v2: any) => {
	if (Array.isArray(v2)) {
		return v2.includes(v1)
	}
	return v1 === v2
}

export const isItemMatched = (
	data: Record<string, any>,
	item: Record<string, any>
) => {
	return Object.entries(data).every(([key, val]) => {
		const keys = key.split('.')
		let value: any = item

		if (isValuesMatch(value, val)) return true

		while (value && keys.length) {
			const key = keys.shift()
			if (key) value = value[key]

			if (isValuesMatch(value, val)) return true
		}

		return false
	})
}
