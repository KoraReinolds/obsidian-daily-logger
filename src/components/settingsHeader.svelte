<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { TTab } from 'src/settings/types'

	let containerEl: HTMLElement
	const {
		addNewBlock,
		pasteBlock,
		canPaste,
		activeTab
	}: {
		addNewBlock: () => void
		pasteBlock: () => void
		canPaste: boolean
		activeTab: TTab
	} = $props()

	const header = $derived(activeTab.data?.settings.header)

	onMount(() => {
		if (!containerEl || !header) return

		const blockHeader = new Setting(containerEl)

		const pasteBtn = blockHeader.addButton((btn) => {
			btn
				.setIcon('clipboard-paste')
				.setTooltip('Paste block')
				.onClick(pasteBlock)
		})

		$effect(() => {
			pasteBtn.setDisabled(!canPaste)
		})

		blockHeader
			.addButton((btn) =>
				btn
					.setButtonText(header.btnText)
					.onClick(addNewBlock)
			)
			.setClass('daily-logger-blocks-header')
	})
</script>

<div bind:this={containerEl}></div>
