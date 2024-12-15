<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { TTab } from 'src/settings/types'
	import { S } from './settingsState.svelte'

	let containerEl: HTMLElement
	const {
		addNewBlock,
		pasteBlock,
		activeTab
	}: {
		addNewBlock: () => void
		pasteBlock: () => void
		activeTab: TTab
	} = $props()

	const header = $derived(activeTab.data?.settings.header)

	onMount(() => {
		if (!containerEl || !header) return

		const blockHeader = new Setting(containerEl)

		blockHeader.addButton((btn) => {
			btn
				.setIcon('clipboard-paste')
				.setTooltip('Paste block')
				.onClick(pasteBlock)

			$effect(() => {
				btn.setDisabled(!S.blockCopy)
			})
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
