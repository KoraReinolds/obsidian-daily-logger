<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { ILoggerSettings } from 'src/settings/types'

	let containerEl: HTMLElement
	const { settings }: { settings: ILoggerSettings } =
		$props()

	const dispatch = createEventDispatcher()

	onMount(() => {
		if (containerEl) {
			new Setting(containerEl)
				.setName('Folder path')
				.setDesc('Specify folder for logs')
				.addText((text) => {
					text
						.setPlaceholder('Type folder path')
						.onChange((value) => {
							settings.global.folderPath = value

							dispatch('save')
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
							settings.global.delimiter = value

							dispatch('save')
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
							settings.global.sectionType = value

							dispatch('save')
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
							settings.global.sectionName = value

							dispatch('save')
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
