<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { ILoggerSettings } from 'src/settings/types'

	let containerEl: HTMLElement
	const {
		settings,
		save
	}: {
		settings: ILoggerSettings
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	onMount(() => {
		if (containerEl) {
			new Setting(containerEl)
				.setName('Folder path')
				.setDesc('Specify folder for logs')
				.addText((text) => {
					text
						.setPlaceholder('Type folder path')
						.onChange((value) => {
							save([(s) => (s.global.folderPath = value)])
						})

					$effect(() => {
						text.setValue(settings.global.folderPath)
					})

					return text
				})

			const globalDeimiter = new Setting(containerEl)
				.setDesc('Specify delimiter for logs')
				.addText((text) => {
					text
						.setPlaceholder('Type delimiter')
						.onChange((value) => {
							save([(s) => (s.global.delimiter = value)])
						})

					$effect(() => {
						const value = settings.global.delimiter

						text.setValue(value)
						globalDeimiter.setName(`Delimiter - "${value}"`)
					})

					return text
				})

			new Setting(containerEl)
				.setName('Section type')
				.addDropdown((type) => {
					type
						.addOptions({
							heading: 'heading',
							callout: 'callout'
						})
						.onChange((value) => {
							save([(s) => (s.global.sectionType = value)])
						})

					$effect(() => {
						type.setValue(settings.global.sectionType)
					})

					return type
				})

			new Setting(containerEl)
				.setName('Section name')
				.addText((text) => {
					text
						.setPlaceholder('Type section name')
						.onChange((value) => {
							save([(s) => (s.global.sectionName = value)])
						})

					$effect(() => {
						text.setValue(settings.global.sectionName)
					})

					return text
				})
		}
	})
</script>

<div bind:this={containerEl}></div>
