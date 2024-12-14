<script lang="ts">
	import { onMount } from 'svelte'
	import {
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
		settings,
		block,
		copyItem,
		save
	}: {
		item: TItem
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

		const blockHeader = new Setting(itemEl).setClass(
			'daily-logger-block-item-header'
		)

		$effect(() => {
			blockHeader.setName(item.name)
		})

		$effect(() => {
			blockHeader.setDesc(getValueFromItem(settings, item))
		})

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

			btn
				.onClick(() => {
					openedItemId = hidden ? item.id : ''
				})
				.setClass('daily-logger-toggle_btn')

			$effect(() => {
				btn.setIcon(
					openedItemId === item.id
						? 'chevron-up'
						: 'chevron-down'
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

<ul class="daily-logger-block-item-list">
	{#each block.order as id}
		{#if openedItemId === id}
			<ItemDetails
				{settings}
				item={settings.items[id]}
				{copyItem}
				{save}
				{block}
			/>
		{/if}
	{/each}
</ul>
