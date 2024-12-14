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
	import { getValueFromItem } from 'src/entities'

	let itemEl: HTMLElement

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

	onMount(() => {
		//const itemEl = itemEl.createEl('li')
		//itemEl.classList.add('daily-logger-block-item')
		if (!itemEl) return

		const blockHeader = new Setting(itemEl)
			.setName(item.name)
			.setDesc(getValueFromItem(settings, item))
			.setClass('daily-logger-block-item-header')

		// copy item
		blockHeader.addButton((btn) => {
			btn
				.setIcon('copy')
				.onClick(() => {
					copyItem(item)
					new Notice('Copy item')
				})
				.setTooltip('Copy item')
		})

		//// show/hide item
		//blockHeader.addButton((btn) => {
		//	const hidden = !(this.openedItemId === id)
		//
		//	btn
		//		.setIcon(hidden ? 'eye' : 'eye-off')
		//		.onClick(() => {
		//			this.openedItemId = hidden ? id : undefined
		//
		//			this.display()
		//		})
		//	btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
		//		hidden ? 'Show' : 'Hide'
		//	}</span>`
		//})

		// remove item
		blockHeader.addButton((btn) => {
			btn.setIcon('trash-2').onClick(() => {
				save([
					(s) => {
						delete s.items[item.id]
						const changedBlock = s.blocks.find(
							(b) => b.id === block.id
						)
						if (changedBlock) {
							changedBlock.order =
								changedBlock.order.filter(
									(blockId) => blockId !== item.id
								)
						}
					}
				])
			})
		})

		//// drag block
		//blockHeader.addButton((btn) => {
		//	btn
		//		.setIcon('grip-vertical')
		//		.setClass('daily-logger-item-drag')
		//})
		//
		////if (this.openedItemId !== id) return
		//
		////this.displayItemDetails(blockHeader, item, itemEl)
	})
</script>

<li class="daily-logger-block-item" bind:this={itemEl}></li>
