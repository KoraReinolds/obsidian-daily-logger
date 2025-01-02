<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { TTab } from 'src/settings/types'
	import { S } from './settingsState.svelte'
	import {
		getValueFromBlock,
		getValueFromItem
	} from 'src/entities'

	let containerEl: HTMLElement
	const {
		addNewBlock,
		pasteBlock,
		activeTab,
		removeGroup,
		renameGroup
	}: {
		addNewBlock: () => void
		pasteBlock: () => void
		activeTab: TTab
		removeGroup: () => void
		renameGroup: (value: string) => void
	} = $props()

	const header = $derived(
		activeTab.data?.settings.header || {
			remove: true
		}
	)

	onMount(() => {
		if (!containerEl || !header) return

		const blockHeader = new Setting(containerEl)

		$effect(() => {
			const data: string[] = []

			if (S.blockCopy)
				data.push(
					`Copied block: ${getValueFromBlock(S.settings, S.blockCopy)}`
				)

			if (S.itemCopy)
				data.push(
					`Copied item: ${getValueFromItem(S.settings, S.itemCopy)}`
				)

			blockHeader.infoEl.innerHTML = data.join('<br>')
			blockHeader.infoEl.classList.add(
				'setting-item-description'
			)
		})

		if (header.rename) {
			blockHeader.addText((text) =>
				text.setValue(activeTab.name).onChange((val) => {
					renameGroup(val)
				})
			)
		}

		blockHeader.addButton((btn) => {
			btn
				.setIcon('clipboard-paste')
				.setTooltip('Paste block')
				.onClick(pasteBlock)

			$effect(() => {
				btn.setDisabled(!S.blockCopy)
			})
		})

		if (header.btnText) {
			blockHeader
				.addButton((btn) =>
					btn
						.setButtonText(header.btnText)
						.onClick(addNewBlock)
				)
				.setClass('daily-logger-blocks-header')
		}

		if (header.remove) {
			blockHeader
				.addButton((btn) =>
					btn
						.setIcon('trash-2')
						.setTooltip('Remove group')
						.onClick(removeGroup)
				)
				.setClass('daily-logger-blocks-header')
		}
	})
</script>

<div bind:this={containerEl}></div>
