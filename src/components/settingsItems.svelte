<script lang="ts">
	import { onMount } from 'svelte'
	import {
		type ILoggerSettings,
		type TBlock,
		type TItem
	} from 'src/settings/types'
	import { Setting } from 'obsidian'
	import Sortable from 'sortablejs'
	import Item from './settingsItem.svelte'
	import { S } from './settingsState.svelte'

	let containerEl: HTMLElement
	let listEl: HTMLElement

	const {
		openedItemId,
		openItem,
		block,
		copyItem
	}: {
		openedItemId: string
		openItem: (id: string) => void
		block: TBlock
		copyItem: (item: TItem) => void
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
						S.save([
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

		Sortable.create(listEl, {
			handle: '.daily-logger-item-drag',
			onEnd: (evt) => {
				S.save([
					(s) => {
						const changedBlock = s.blocks.find(
							(b) => b.id === block.id
						)
						const oldIndex = evt.oldDraggableIndex
						const newIndex = evt.newDraggableIndex

						if (
							!changedBlock ||
							oldIndex === undefined ||
							newIndex === undefined
						)
							return
						;[
							[changedBlock.order[oldIndex]],
							[changedBlock.order[newIndex]]
						] = [
							[changedBlock.order[newIndex]],
							[changedBlock.order[oldIndex]]
						]
					}
				])
			}
		})
	})
</script>

<div
	class="daily-logger-block-item"
	bind:this={containerEl}
></div>

<ul bind:this={listEl} class="daily-logger-block-item-list">
	{#each block.order as id}
		{#key block.order}
			<Item
				item={S.settings.items[id]}
				{openedItemId}
				{openItem}
				{copyItem}
				{block}
			/>
		{/key}
	{/each}
</ul>
