export function moveElement<T>(
	array: T[],
	fromIndex: number | undefined,
	toIndex: number | undefined
): T[] {
	if (
		!array ||
		fromIndex === undefined ||
		toIndex === undefined
	)
		return []

	const newArray = [...array]
	const element = newArray.splice(fromIndex, 1)[0]

	const adjustedToIndex =
		toIndex > fromIndex ? toIndex - 1 : toIndex

	newArray.splice(adjustedToIndex, 0, element)
	return newArray
}

export function escapeRegex(pattern: string): string {
	/**
	 * Экранирует специальные символы в строке для использования в регулярных выражениях.
	 *
	 * @param pattern - Строка, которую нужно экранировать.
	 * @returns Экранированная строка.
	 */
	return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
