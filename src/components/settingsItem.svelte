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
	import { getValueFromItem } from 'src/entities'
	import ItemDetails from './settingsItemDetails.svelte'

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

	let openedItemId: string | null = $state(null)

	onMount(() => {
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

		// show/hide item
		blockHeader.addButton((btn) => {
			const hidden = $derived(openedItemId !== item.id)

			btn.onClick(() => {
				openedItemId = hidden ? item.id : ''
			})

			$effect(() => {
				btn.setIcon(
					openedItemId === item.id ? 'eye-off' : 'eye'
				)
			})
		})

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

		// drag block
		blockHeader.addButton((btn) => {
			btn
				.setIcon('grip-vertical')
				.setClass('daily-logger-item-drag')
		})
	})
</script>

<li class="daily-logger-block-item" bind:this={itemEl}></li>

{#if openedItemId}
	<ul class="daily-logger-block-item-list">
		{#each block.order as id}
			<ItemDetails
				{settings}
				item={settings.items[id]}
				{copyItem}
				{save}
				{block}
			/>
		{/each}
	</ul>
{/if}
