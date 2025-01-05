<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'

	let containerEl: HTMLElement

	const {
		groupName,
		isHidden,
		change
	}: {
		groupName: string
		isHidden: boolean
		change: (val: string) => void
	} = $props()

	onMount(() => {
		if (!containerEl) return

		const groupsSettings = new Setting(containerEl).setName(
			groupName
		)

		groupsSettings
			.addToggle((toggle) => {
				toggle
					.setValue(isHidden)
					.onChange(() => change(groupName))
			})
			.setClass('daily-logger-block-item-data')
	})
</script>

<li bind:this={containerEl}></li>
