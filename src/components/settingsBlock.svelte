<script lang="ts">
	import { onMount } from 'svelte'
	import { v4 as uuidv4 } from 'uuid'
	import {
		ELoggerType,
		type ILoggerSettings,
		type TBlock,
		type TItem
	} from 'src/settings/types'
	import { Notice, Setting } from 'obsidian'
	import Items from './settingsItems.svelte'
	import { getValueFromItem } from 'src/entities'

	let blockEl: HTMLElement

	const {
		openedBlockId,
		openBlock,
		settings,
		block,
		copyBlock,
		save
	}: {
		openedBlockId: string
		openBlock: (id: string) => void
		settings: ILoggerSettings
		block: TBlock
		copyBlock: (block: TBlock) => void
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	let itemCopy: TItem | null = $state(null)

	const blockPreview = $derived(
		block.order
			.map((id) => settings.items[id])
			.filter((item) => !!item)
			.map((item) => getValueFromItem(settings, item))
			.join(settings.global.delimiter)
	)

	const getNewItem = (params: Partial<TItem> = {}) => {
		const id = uuidv4()

		return {
			id: id,
			type: 'text',
			name: '',
			value: '',
			anyText: false,
			isOptional: false,
			defaultValue: '',
			nested: [],
			delimiter: '',
			...params
		}
	}

	onMount(() => {
		if (!blockEl) return

		const id = block.id

		// block header
		const header = new Setting(blockEl)
			.setDesc(blockPreview)
			.setClass('daily-logger-block-header')

		$effect(() => {
			header.setName(block.name)
		})

		// block copy
		if (block.type === ELoggerType.LOGGER) {
			header.addButton((btn) => {
				btn
					.setIcon('copy')
					.onClick(() => {
						copyBlock(block)
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
					if (!itemCopy) return

					const item = getNewItem(itemCopy)

					save([
						(s) => {
							const block = s.blocks.find(
								(b) => b.id === openedBlockId
							)
							block?.order.push(item.id)
							s.items[item.id] = item
						}
					])
				})

			$effect(() => {
				btn.setDisabled(
					!!block.locked ||
						!itemCopy ||
						itemCopy.type === block.id // same template
				)
			})
		})

		// add item to block
		header.addButton((btn) => {
			btn
				.setIcon('plus')
				.setDisabled(!!block.locked)
				.onClick(() => {
					block.order.push(this.addNewItem())
					openBlock(id)
				})
		})

		// show/hide block
		header.addButton((btn) => {
			const hidden = $derived(openedBlockId !== id)

			btn.setDisabled(!!block.locked).onClick(() => {
				openBlock(hidden ? id : '')
			})

			$effect(() => {
				btn.setIcon(
					openedBlockId === id ? 'eye-off' : 'eye'
				)
			})
		})

		// remove block
		header.addButton((btn) => {
			btn
				.setIcon('trash-2')
				.setDisabled(!!block.locked)
				.onClick(() => {
					save([
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

{#if block.id === openedBlockId}
	<Items
		{block}
		{settings}
		{save}
		copyItem={(item: TItem) => (itemCopy = item)}
	/>
{/if}
