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
	class="daily-logger-block-item"
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
