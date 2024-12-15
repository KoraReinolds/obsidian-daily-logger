<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting } from 'obsidian'
	import type { ILoggerSettings } from 'src/settings/types'
	import { S } from './settingsState.svelte'

	let containerEl: HTMLElement

	onMount(() => {
		if (containerEl) {
			new Setting(containerEl)
				.setName('Folder path')
				.setDesc('Specify folder for logs')
				.addText((text) => {
					text
						.setPlaceholder('Type folder path')
						.onChange((value) => {
							S.save([(s) => (s.global.folderPath = value)])
						})

					$effect(() => {
						text.setValue(S.settings.global.folderPath)
					})

					return text
				})

			const globalDeimiter = new Setting(containerEl)
				.setDesc('Specify delimiter for logs')
				.addText((text) => {
					text
						.setPlaceholder('Type delimiter')
						.onChange((value) => {
							S.save([(s) => (s.global.delimiter = value)])
						})

					$effect(() => {
						const value = S.settings.global.delimiter

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
							S.save([
								(s) => (s.global.sectionType = value)
							])
						})

					$effect(() => {
						type.setValue(S.settings.global.sectionType)
					})

					return type
				})

			new Setting(containerEl)
				.setName('Section name')
				.addText((text) => {
					text
						.setPlaceholder('Type section name')
						.onChange((value) => {
							S.save([
								(s) => (s.global.sectionName = value)
							])
						})

					$effect(() => {
						text.setValue(S.settings.global.sectionName)
					})

					return text
				})
		}
	})
</script>

<div bind:this={containerEl}></div>
