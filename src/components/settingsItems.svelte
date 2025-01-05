<script lang="ts">
	import { onMount } from 'svelte'
	import {
		ELoggerType,
		type TBlock,
		type TMeta
	} from 'src/settings/types'
	import { Setting } from 'obsidian'
	import Sortable from 'sortablejs'
	import Item from './settingsItem.svelte'
	import { S } from './settingsState.svelte'
	import { v4 as uuidv4 } from 'uuid'
	import BlockMeta from './settingsMeta.svelte'
	import BlockGroup from './settingsGroups.svelte'
	import { moveElement } from 'src/lib/string'

	let containerEl: HTMLElement
	let listEl: HTMLElement
	let metaEl: HTMLElement
	let groupEl: HTMLElement
	let openedMeta = $state(false)
	let openedGroups = $state(false)

	const {
		block
	}: {
		block: TBlock
	} = $props()

	if (!block.groups) {
		block.groups = {}
	}

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
		if (!containerEl || !listEl || !metaEl || !groupEl)
			return

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

		new Setting(containerEl)
			.setName('Path')
			.addText((text) =>
				text
					.setPlaceholder('Type file or folder path')
					.setValue(block.path || '')
					.onChange((value) => {
						S.save([
							(s) => {
								const changedBlock = s.blocks.find(
									(b) => block.id === b.id
								)
								if (changedBlock) changedBlock.path = value
							}
						])
					})
			)
			.setClass('daily-logger-block-item-header')

		new Setting(containerEl)
			.setName('Section name')
			.addText((text) =>
				text
					.setPlaceholder('Type section name')
					.setValue(block.sectionName)
					.onChange((value) => {
						S.save([
							(s) => {
								const changedBlock = s.blocks.find(
									(b) => block.id === b.id
								)
								if (changedBlock)
									changedBlock.sectionName = value
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
						openedMeta = true
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

		if (block.type === ELoggerType.LOGGER) {
			const groupSettings = new Setting(containerEl)
				.setName('Groups')
				.addButton((btn) => {
					btn
						.onClick(() => {
							openedGroups = !openedGroups
						})
						.setClass('daily-logger-toggle_btn')

					$effect(() => {
						btn.setIcon(
							openedGroups ? 'chevron-up' : 'chevron-down'
						)
					})
				})
				.setClass('daily-logger-block-item-header')

			$effect(() => {
				groupSettings.setDesc(
					Object.entries(block.groups)
						.filter((item) => !!item[1])
						.map((item) => item[0])
						.join(',')
				)
			})
		}

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

						if (!changedBlock) return

						changedBlock.order = moveElement(
							changedBlock.order,
							oldIndex,
							newIndex
						)
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

<ul
	bind:this={groupEl}
	class="daily-logger-block-item-list"
>
	{#if openedGroups}
		{#each Object.entries(block.groups) as group}
			<BlockGroup
				groupName={group[0]}
				isHidden={group[1]}
				change={(val: string) => {
					block.groups[val] = !block.groups[val]
				}}
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
