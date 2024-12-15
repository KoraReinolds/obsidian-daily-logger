<script lang="ts">
	import { onMount } from 'svelte'
	import {
		type TBlock,
		type TMeta
	} from 'src/settings/types'
	import { Setting } from 'obsidian'
	import Sortable from 'sortablejs'
	import Item from './settingsItem.svelte'
	import { S } from './settingsState.svelte'
	import { v4 as uuidv4 } from 'uuid'
	import BlockMeta from './settingsMeta.svelte'

	let containerEl: HTMLElement
	let listEl: HTMLElement
	let metaEl: HTMLElement
	let openedMeta = $state(false)

	const {
		block
	}: {
		block: TBlock
	} = $props()

	const changeMeta = (newMeta: TMeta) => {
		S.save([
			(s) => {
				const changedBlock = s.blocks.find(
					(b) => b.id === block.id
				)

				if (changedBlock)
					changedBlock.meta = changedBlock.meta.map((m) =>
						m.id === newMeta.id ? newMeta : m
					)
			}
		])
	}

	const removeMetaItem = (id: string) => {
		S.save([
			(s) => {
				const changedBlock = s.blocks.find(
					(b) => b.id === block.id
				)

				if (changedBlock)
					changedBlock.meta = changedBlock.meta.filter(
						(m) => m.id === id
					)
			}
		])
	}

	onMount(() => {
		if (!containerEl || !listEl || !metaEl) return

		new Setting(containerEl)
			.setName('Name')
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

		const metaSettings = new Setting(containerEl)
			.setName('Meta')
			.addButton((btn) => {
				btn
					.onClick(() => {
						openedMeta = !openedMeta
					})
					.setClass('daily-logger-toggle_btn')

				$effect(() => {
					btn.setIcon(
						openedMeta ? 'chevron-up' : 'chevron-down'
					)
				})
			})
			.addButton((btn) => {
				btn
					.setIcon('plus')
					.setTooltip('Add meta info')
					.onClick(() => {
						S.save([
							(s) => {
								const changedBlock = s.blocks.find(
									(b) => b.id === block.id
								)

								changedBlock?.meta.push({
									id: uuidv4(),
									key: '',
									value: ''
								})
							}
						])
					})
			})

			.setClass('daily-logger-block-item-header')

		$effect(() => {
			metaSettings.setDesc(
				block.meta.length
					? block.meta
							.map((m) => `(${m.key} - ${m.value})`)
							.join(' ')
					: 'No meta'
			)
		})

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

<ul bind:this={metaEl} class="daily-logger-block-item-list">
	{#if openedMeta}
		{#each block.meta as meta}
			<BlockMeta
				{meta}
				change={changeMeta}
				remove={() => removeMetaItem(meta.id)}
			/>
		{/each}
	{/if}
</ul>

<ul bind:this={listEl} class="daily-logger-block-item-list">
	{#each block.order as id}
		{#key block.order}
			<Item item={S.settings.items[id]} {block} />
		{/key}
	{/each}
</ul>
