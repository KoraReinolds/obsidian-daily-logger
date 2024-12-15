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
	import { S } from './settingsState.svelte'

	let itemEl: HTMLElement

	const {
		item,
		block
	}: {
		item: TItem
		block: TBlock
	} = $props()

	onMount(() => {
		if (!itemEl) return

		const blockHeader = new Setting(itemEl).setClass(
			'daily-logger-block-item-header'
		)

		$effect(() => {
			blockHeader.setName(item.name)
		})

		$effect(() => {
			blockHeader.setDesc(
				getValueFromItem(S.settings, item)
			)
		})

		// copy item
		blockHeader.addButton((btn) => {
			btn
				.setIcon('copy')
				.onClick(() => {
					S.itemCopy = item
					new Notice('Copy item')
				})
				.setTooltip('Copy item')
		})

		// show/hide item
		blockHeader.addButton((btn) => {
			const hidden = $derived(S.openedItemId !== item.id)

			btn
				.onClick(() => {
					S.openedItemId = hidden ? item.id : ''
				})
				.setClass('daily-logger-toggle_btn')

			$effect(() => {
				btn.setIcon(
					S.openedItemId === item.id
						? 'chevron-up'
						: 'chevron-down'
				)
			})
		})

		// remove item
		blockHeader.addButton((btn) => {
			btn.setIcon('trash-2').onClick(() => {
				S.save([
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

<li class="daily-logger-block-item">
	<div
		class="daily-logger-block-item-header"
		bind:this={itemEl}
	></div>
	{#if S.openedItemId === item.id}
		<ul class="daily-logger-block-item-list">
			<ItemDetails
				item={S.settings.items[S.openedItemId]}
				{block}
			/>
		</ul>
	{/if}
</li>
