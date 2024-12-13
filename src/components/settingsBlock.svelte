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
		settings,
		block,
		copyBlock
	}: {
		settings: ILoggerSettings
		block: TBlock
		copyBlock: (block: TBlock) => void
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
					this.settings

					block.order.push(this.addNewItem())
					this.openedBlockId = id
					this.display()
				})
		})

		// show/hide block
		header.addButton((btn) => {
			const hidden = !(this.openedBlockId === id)

			btn
				.setIcon(hidden ? 'eye' : 'eye-off')
				.setDisabled(!!block.locked)
				.onClick(() => {
					this.openedBlockId = hidden ? id : undefined

					this.display()
				})
			btn.buttonEl.innerHTML += `<span style=margin-left:8px;>${
				hidden ? 'Show' : 'Hide'
			}</span>`
		})

		// remove block
		header.addButton((btn) => {
			btn
				.setIcon('trash-2')
				.setDisabled(!!block.locked)
				.onClick(() => {
					block.order.forEach(
						(id) => delete this.settings.items[id]
					)

					this.settings.blocks =
						this.settings.blocks.filter(
							(item) => item.id !== id
						)

					this.plugin.saveSettings()
					this.display()
				})
		})
	})
</script>

<div class="daily-logger-block" bind:this={blockEl}></div>
