<script lang="ts">
	import { onMount } from 'svelte'
	import {
		DEFAUTL_ITEM_DATA,
		EItemType,
		ELoggerType,
		type ILoggerSettings,
		type TBlock,
		type TItem
	} from 'src/settings/types'
	import { Setting } from 'obsidian'
	import { getValueFromItem, itemData } from 'src/entities'
	import type { TItemData } from 'src/entities/types'
	import { S } from './settingsState.svelte'

	let containerEl: HTMLElement

	const {
		item,
		block,
		save
	}: {
		item: TItem
		block: TBlock
		copyItem: (item: TItem) => void
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	onMount(() => {
		if (!containerEl) return

		const templates = S.settings.blocks
			.filter(
				(block) => block.type === ELoggerType.TEMPLATE
			)
			.map((item) => [item.id, item.name])
			.filter(([id]) => {
				return id !== block.id
			})

		// item type
		if (templates.length) {
			new Setting(containerEl)
				.setName('Type')
				.addDropdown((dd) =>
					dd
						.addOptions(Object.fromEntries(templates))
						.setValue(item.type)
						.onChange((value) => {
							save([
								(s) => {
									const changedItem = s.items[item.id]
									changedItem.type = value

									const data: TItemData =
										(itemData[
											changedItem.type as EItemType
										] as TItemData) || DEFAUTL_ITEM_DATA

									changedItem.value = data.defaultValue
								}
							])
						})
				)
				.setClass('daily-logger-block-item-data')
		}

		// item key
		new Setting(containerEl)
			.setName('Key')
			.addText((text) =>
				text
					.setPlaceholder('Type key')
					.setValue(item.name)
					.onChange(async (value) => {
						save([
							(s) => {
								const changedItem = s.items[item.id]
								changedItem.name = value
							}
						])
					})
			)
			.setClass('daily-logger-block-item-data')

		// item any text
		if (item.type === EItemType.text)
			new Setting(containerEl)
				.setName('Any text')
				.addToggle((comp) =>
					comp
						.setValue(item.anyText)
						.onChange(async (value) => {
							save([
								(s) => {
									const changedItem = s.items[item.id]
									changedItem.anyText = value
								}
							])
						})
				)
				.setClass('daily-logger-block-item-data')

		const data = itemData[item.type as EItemType]
		// item value
		if (!item.anyText)
			new Setting(containerEl)
				.setName('Value')
				.addText((text) =>
					text
						.setPlaceholder('Type value')
						.setValue(getValueFromItem(S.settings, item))
						.onChange(async (value) => {
							save([
								(s) => {
									const changedItem = s.items[item.id]
									changedItem.value = value
								}
							])
						})
						.setDisabled(data ? data.isDisabled : true)
				)
				.setClass('daily-logger-block-item-data')

		// item default value
		new Setting(containerEl)
			.setName('Default value')
			.addText((text) =>
				text
					.setPlaceholder('Type default value')
					.setValue(item.defaultValue)
					.onChange(async (value) => {
						save([
							(s) => {
								const changedItem = s.items[item.id]
								changedItem.defaultValue = value
							}
						])
					})
					.setDisabled(data ? data.isDisabled : true)
			)
			.setClass('daily-logger-block-item-data')

		// item optional
		new Setting(containerEl)
			.setName('Optional value')
			.addToggle((comp) =>
				comp
					.setValue(item.isOptional)
					.onChange(async (value) => {
						save([
							(s) => {
								const changedItem = s.items[item.id]
								changedItem.isOptional = value
							}
						])
					})
			)
			.setClass('daily-logger-block-item-data')

		// item delimiter
		if (!EItemType[item.type]) {
			new Setting(containerEl)
				.setName('Delimiter')
				.addText((text) =>
					text
						.setPlaceholder('Overwrite global delimiter')
						.setValue(item.delimiter)
						.onChange((value) => {
							save([
								(s) => {
									const changedItem = s.items[item.id]
									changedItem.delimiter = value
								}
							])
						})
				)
				.setClass('daily-logger-block-item-data')
		}
	})
</script>

<div bind:this={containerEl}></div>
