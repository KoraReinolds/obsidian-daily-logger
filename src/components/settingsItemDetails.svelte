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
	import { Notice, Setting } from 'obsidian'
	import { getValueFromItem, itemData } from 'src/entities'
	import ItemDetails from './settingsItemDetails.svelte'
	import type { TItemData } from 'src/entities/types'

	let containerEl: HTMLElement

	const {
		item,
		//openedBlockId,
		//openBlock,
		settings,
		block,
		//changeBlock
		copyItem,
		save
	}: {
		item: TItem
		//openedBlockId: string
		//openBlock: (id: string) => void
		//changeBlock: (block: TBlock) => void
		settings: ILoggerSettings
		block: TBlock
		copyItem: (item: TItem) => void
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	let openedItemId: TItem | null = $state(null)

	onMount(() => {
		//const itemEl = itemEl.createEl('li')
		//itemEl.classList.add('daily-logger-block-item')
		if (!containerEl) return

		const templates = settings.blocks
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
							item.type = value

							const data: TItemData =
								(itemData[
									item.type as EItemType
								] as TItemData) || DEFAUTL_ITEM_DATA

							item.value = data.defaultValue

							//this.plugin.saveSettings()
							//this.display()
						})
				)
				.setClass('daily-logger-block-item-data')
		}

		//// item key
		//new Setting(containerEl)
		//	.setName('Key')
		//	.addText((text) =>
		//		text
		//			.setPlaceholder('Type key')
		//			.setValue(item.name)
		//			.onChange(async (value) => {
		//				item.name = value
		//				header.setName(value)
		//				await this.plugin.saveSettings()
		//			})
		//	)
		//	.setClass('daily-logger-block-item-data')
		//
		//// item any text
		//if (item.type === EItemType.text)
		//	new Setting(containerEl)
		//		.setName('Any text')
		//		.addToggle((comp) =>
		//			comp
		//				.setValue(item.anyText)
		//				.onChange(async (val) => {
		//					item.anyText = val
		//
		//					await this.plugin.saveSettings()
		//					this.displayPreview()
		//					this.display()
		//				})
		//		)
		//		.setClass('daily-logger-block-item-data')
		//
		//const data = itemData[item.type as EItemType]
		//// item value
		//if (!item.anyText)
		//	new Setting(containerEl)
		//		.setName('Value')
		//		.addText((text) =>
		//			text
		//				.setPlaceholder('Type value')
		//				.setValue(this.getValueFromItem(item))
		//				.onChange(async (value) => {
		//					item.value = value
		//					header.setDesc(value)
		//					await this.plugin.saveSettings()
		//					this.settings = this.plugin.settings
		//					this.displayPreview()
		//				})
		//				.setDisabled(data ? data.isDisabled : true)
		//		)
		//		.setClass('daily-logger-block-item-data')
		//
		//// item default value
		//new Setting(containerEl)
		//	.setName('Default value')
		//	.addText((text) =>
		//		text
		//			.setPlaceholder('Type default value')
		//			.setValue(item.defaultValue)
		//			.onChange(async (value) => {
		//				item.defaultValue = value
		//				await this.plugin.saveSettings()
		//			})
		//			.setDisabled(data ? data.isDisabled : true)
		//	)
		//	.setClass('daily-logger-block-item-data')
		//
		//// item optional
		//new Setting(containerEl)
		//	.setName('Optional value')
		//	.addToggle((comp) =>
		//		comp
		//			.setValue(item.isOptional)
		//			.onChange(async (val) => {
		//				item.isOptional = val
		//
		//				await this.plugin.saveSettings()
		//			})
		//	)
		//	.setClass('daily-logger-block-item-data')
		//
		//// item delimiter
		//if (!EItemType[item.type]) {
		//	new Setting(containerEl)
		//		.setName('Delimiter')
		//		.addText((text) =>
		//			text
		//				.setPlaceholder('Overwrite global delimiter')
		//				.setValue(item.delimiter)
		//				.onChange((value) => {
		//					item.delimiter = value
		//
		//					this.plugin.saveSettings()
		//					this.displayPreview()
		//					header.setDesc(this.getValueFromItem(item))
		//				})
		//		)
		//		.setClass('daily-logger-block-item-data')
		//}

		////this.displayItemDetails(blockHeader, item, itemEl)
	})
</script>

<div bind:this={containerEl}></div>
