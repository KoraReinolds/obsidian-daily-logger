<script lang="ts">
	import { onMount } from 'svelte'
	import { v4 as uuidv4 } from 'uuid'
	import {
		ELoggerType,
		type TBlock,
		type TItem
	} from 'src/settings/types'
	import { Notice, Setting } from 'obsidian'
	import Items from './settingsItems.svelte'
	import { getValueFromBlock } from 'src/entities'
	import { S } from './settingsState.svelte'

	let blockEl: HTMLElement

	const {
		block
	}: {
		block: TBlock
	} = $props()

	const blockPreview = $derived(
		getValueFromBlock(S.settings, block)
	)

	const getNewItem = (params: Partial<TItem> = {}) => {
		const id = uuidv4()

		return {
			type: 'text',
			name: '',
			value: '',
			anyText: false,
			isOptional: false,
			defaultValue: '',
			nested: [],
			delimiter: '',
			...params,
			id: id
		}
	}

	onMount(() => {
		if (!blockEl) return

		const id = block.id

		// block header
		const header = new Setting(blockEl).setClass(
			'daily-logger-block-header'
		)

		$effect(() => {
			header.setName(block.name)
		})

		$effect(() => {
			header.setDesc(blockPreview)
		})

		// block copy
		if (block.type === ELoggerType.LOGGER) {
			header.addButton((btn) => {
				btn
					.setIcon('copy')
					.onClick(() => {
						S.blockCopy = block
						new Notice('Copy block')
					})
					.setTooltip('Copy block')
			})
		}

		// block paste item
		header.addButton((btn) => {
			btn
				.setIcon('clipboard-paste')
				.setTooltip('Paste item')
				.onClick(() => {
					if (!S.itemCopy) return

					const item = getNewItem(S.itemCopy)

					S.save([
						(s) => {
							const changedBlock = s.blocks.find(
								(b) => b.id === block.id
							)
							changedBlock?.order.push(item.id)
							s.items[item.id] = item
						}
					])
				})

			$effect(() => {
				btn.setDisabled(
					!!block.locked ||
						!S.itemCopy ||
						S.itemCopy.type === block.id // same template
				)
			})
		})

		// add item to block
		header.addButton((btn) => {
			btn
				.setIcon('plus')
				.setDisabled(!!block.locked)
				.onClick(() => {
					S.save([
						(s) => {
							const item = getNewItem()
							const changedBlock = s.blocks.find(
								(b) => b.id === block.id
							)
							changedBlock?.order.push(item.id)
							s.items[item.id] = item
						}
					])
					S.openedBlockId = id
				})
		})

		// show/hide block
		header.addButton((btn) => {
			const hidden = $derived(S.openedBlockId !== id)

			btn
				.setDisabled(!!block.locked)
				.onClick(() => {
					S.openedBlockId = hidden ? id : ''
				})
				.setClass('daily-logger-toggle_btn')

			$effect(() => {
				btn.setIcon(
					S.openedBlockId === id
						? 'chevron-up'
						: 'chevron-down'
				)
			})
		})

		// remove block
		header.addButton((btn) => {
			btn
				.setIcon('trash-2')
				.setDisabled(!!block.locked)
				.onClick(() => {
					S.save([
						(s) => {
							const changedBlock = s.blocks.find(
								(b) => b.id === block.id
							)
							changedBlock?.order.forEach(
								(id) => delete s.items[id]
							)
							s.blocks = s.blocks.filter(
								(b) => b.id !== block.id
							)
						}
					])
				})
		})
	})
</script>

<div class="daily-logger-block" bind:this={blockEl}></div>

{#if block.id === S.openedBlockId}
	<Items {block} />
{/if}
