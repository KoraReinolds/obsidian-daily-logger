<script lang="ts">
	import { onMount } from 'svelte'
	import {
		EItemType,
		ELoggerType,
		type ILoggerSettings,
		type TBlock,
		type TItem
	} from 'src/settings/types'
	import { Notice, Setting } from 'obsidian'
	import Sortable from 'sortablejs'
	import Item from './settingsItem.svelte'

	let containerEl: HTMLElement
	let listEl: HTMLElement

	const {
		//openedBlockId,
		//openBlock,
		settings,
		block,
		//changeBlock,
		copyItem,
		//copyBlock,
		save
	}: {
		//openedBlockId: string
		//openBlock: (id: string) => void
		//changeBlock: (block: TBlock) => void
		settings: ILoggerSettings
		block: TBlock
		copyItem: (item: TItem) => void
		//copyBlock: (block: TBlock) => void
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	onMount(() => {
		if (!containerEl || !listEl) return

		new Setting(containerEl)
			.setName('Command name')
			.setDesc('Name of command for call this log')
			.addText((text) =>
				text
					.setPlaceholder('Type name')
					.setValue(block.name)
					.onChange((value) => {
						save([
							(s) => {
								const changedBlock = s.blocks.find(
									(b) => block.id === b.id
								)
								if (changedBlock) changedBlock.name = value
							}
						])
					})
			)
			.setClass('daily-logger-block-item-header')

		//const { order } = block
		//const items = settings.items

		//const listEl = containerEl.createEl('ul')
		//listEl.classList.add()

		//order.forEach((id) => {
		//	const item = items[id]
		//
		//	if (!item) return

		//	const itemEl = listEl.createEl('li')
		//	itemEl.classList.add('daily-logger-block-item')
		//
		//	const blockHeader = new Setting(itemEl)
		//		.setName(item.name)
		//		.setDesc(this.getValueFromItem(item))
		//		.setClass('daily-logger-block-item-header')
		//
		//	// copy item
		//	blockHeader.addButton((btn) => {
		//		btn
		//			.setIcon('copy')
		//			.onClick(() => {
		//				this.itemCopy = item
		//				this.plugin.saveSettings()
		//
		//				this.display()
		//				new Notice('Copy item')
		//			})
		//			.setTooltip('Copy item')
		//	})
		//
		//	// show/hide item
		//	blockHeader.addButton((btn) => {
		//		const hidden = !(this.openedItemId === id)
		//
		//		btn
		//			.setIcon(hidden ? 'eye' : 'eye-off')
		//			.onClick(() => {
		//				this.openedItemId = hidden ? id : undefined
		//
		//				this.display()
		//			})
		//		btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
		//			hidden ? 'Show' : 'Hide'
		//		}</span>`
		//	})
		//
		//	// remove item
		//	blockHeader.addButton((btn) => {
		//		btn.setIcon('trash-2').onClick(() => {
		//			delete this.settings.items[id]
		//
		//			block.order = order.filter(
		//				(blockId) => blockId !== id
		//			)
		//
		//			this.plugin.saveSettings()
		//			this.display()
		//		})
		//	})
		//
		//	// drag block
		//	blockHeader.addButton((btn) => {
		//		btn
		//			.setIcon('grip-vertical')
		//			.setClass('daily-logger-item-drag')
		//	})
		//
		//	if (this.openedItemId !== id) return
		//
		//	this.displayItemDetails(blockHeader, item, itemEl)

		Sortable.create(listEl, {
			handle: '.daily-logger-item-drag',
			onEnd: (evt) => {
				save([
					(s) => {
						const changedBlock = s.blocks.find(
							(b) => b.id === block.id
						)

						if (
							!changedBlock ||
							evt.oldIndex === undefined ||
							evt.newIndex === undefined
						)
							return
						;[
							[changedBlock.order[evt.oldIndex]],
							[changedBlock.order[evt.newIndex]]
						] = [
							[changedBlock.order[evt.newIndex]],
							[changedBlock.order[evt.oldIndex]]
						]
					}
				])
			}
		})
	})
</script>

<div
	class="daily-logger-block"
	bind:this={containerEl}
></div>
<ul bind:this={listEl} class="daily-logger-block-item-list">
	{#each block.order as id}
		<Item
			{settings}
			item={settings.items[id]}
			{copyItem}
			{save}
			{block}
		/>
	{/each}
</ul>
