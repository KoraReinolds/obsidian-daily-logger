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
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	const getValueFromItem = (item: TItem): string => {
		switch (item.type) {
			case EItemType.text:
			case EItemType.hours:
			case EItemType.minutes:
			case EItemType.link: {
				if (item.anyText) return '...'
				return item.value
			}
			default: {
				const block = settings.blocks.find(
					(block) => block.id === item.type
				)

				if (!block) return ''

				return block.order
					.map((id) => settings.items[id])
					.map((item) => getValueFromItem(item))
					.join(item.delimiter)
			}
		}
	}

	const blockPreview = $derived(
		block.order
			.map((id) => settings.items[id])
			.filter((item) => !!item)
			.map((item) => getValueFromItem(item))
			.join(settings.global.delimiter)
	)

	onMount(() => {
		if (!blockEl) return

		const id = block.id

		// block header
		const header = new Setting(blockEl)
			.setName(block.name)
			.setDesc(blockPreview)
			.setClass('daily-logger-block-header')

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
					const id = this.addNewItem(this.itemCopy)

					block.order.push(id)
					this.plugin.saveSettings()
					this.display()
				})
				.setDisabled(
					!!block.locked ||
						!this.itemCopy ||
						this.itemCopy.type === block.id // same template
				)
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
					const copy: ILoggerSettings = JSON.parse(
						JSON.stringify(settings)
					)

					block.order.forEach((id) => delete copy.items[id])

					copy.blocks = copy.blocks.filter(
						(item) => item.id !== id
					)

					save(copy)
				})
		})
	})
</script>

<div class="daily-logger-block" bind:this={blockEl}></div>
