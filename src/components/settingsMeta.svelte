<script lang="ts">
	import { onMount } from 'svelte'
	import { type TMeta } from 'src/settings/types'
	import { Setting } from 'obsidian'

	let containerEl: HTMLElement

	const {
		meta,
		remove,
		change
	}: {
		meta: TMeta
		remove: () => void
		change: (meta: TMeta) => void
	} = $props()

	onMount(() => {
		if (!containerEl) return

		const metaSettings = new Setting(containerEl)
			.addText((text) =>
				text
					.setPlaceholder('Type key')
					.setValue(meta.key)
					.onChange(async (value) => {
						change({ ...meta, key: value })
					})
			)
			.addText((text) =>
				text
					.setPlaceholder('Type value')
					.setValue(meta.value)
					.onChange(async (value) => {
						change({ ...meta, value })
					})
			)
			.addButton((btn) => {
				btn.setIcon('trash-2').onClick(() => {
					remove()
				})
			})

			.setClass('daily-logger-block-item-data')

		$effect(() => {
			metaSettings.setName(meta.key)
		})

		$effect(() => {
			metaSettings.setDesc(meta.value)
		})
	})
</script>

<div bind:this={containerEl}></div>
