<script lang="ts">
	import { onMount } from 'svelte'
	import { Setting, ButtonComponent } from 'obsidian'
	import {
		ELoggerType,
		type ILoggerSettings,
		type TItem
	} from 'src/settings/types'
	import { getItemsFromBlock } from 'src/settings/model'

	let containerEl: HTMLElement

	const {
		settings,
		resolve
	}: {
		settings: ILoggerSettings
		resolve: (val: any) => Promise<void>
	} = $props()

	let list: string[] = $state(
		settings.blocks
			.filter((block) => block.type === ELoggerType.LOGGER)
			.map((block) => block.name)
	)
	let items: TItem[] = $state([])
	let blockType: string = $state(list[0])

	onMount(() => {
		if (!containerEl) return

		new Setting(containerEl)
			.setName('Type')
			.addDropdown((dd) => {
				dd.addOptions(
					Object.fromEntries(
						list.map((item) => [item, item])
					)
				)
					.setValue(blockType)
					.onChange(async (value) => {
						this.blockType = value
						const block = settings.blocks.find(
							(block) => block.name === value
						)

						if (!block) {
							items = []
							return
						}

						items = getItemsFromBlock(settings, block.id)
					})
			})

		const buttonContainer = containerEl.createDiv({
			cls: 'modal-buttons'
		})

		new ButtonComponent(buttonContainer)
			.setButtonText('OK')
			.setCta()
			.onClick(() => {
				resolve(this.blockType)
			})

		new ButtonComponent(buttonContainer)
			.setButtonText('Cancel')
			.onClick(() => {
				resolve(false)
			})
	})
</script>

<div bind:this={containerEl}></div>
