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
		save: (settings: ILoggerSettings) => Promise<void>
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
							const copy: ILoggerSettings = JSON.parse(
								JSON.stringify(settings)
							)
							copy.global.folderPath = value

							save(copy)
						})

					$effect(() => {
						console.log('call effect')
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
							const copy: ILoggerSettings = JSON.parse(
								JSON.stringify(settings)
							)
							copy.global.delimiter = value

							save(copy)
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
							const copy: ILoggerSettings = JSON.parse(
								JSON.stringify(settings)
							)
							copy.global.sectionType = value

							save(copy)
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
							const copy: ILoggerSettings = JSON.parse(
								JSON.stringify(settings)
							)
							copy.global.sectionName = value

							save(copy)
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
