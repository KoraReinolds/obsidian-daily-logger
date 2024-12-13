<script lang="ts">
	import { onMount } from 'svelte'
	import { v4 as uuidv4 } from 'uuid'
	import { Setting } from 'obsidian'
	import type {
		ILoggerSettings,
		TBlock,
		TTabs
	} from 'src/settings/types'

	let containerEl: HTMLElement
	const {
		settings,
		tabs,
		save
	}: {
		settings: ILoggerSettings
		tabs: TTabs
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	const activeTab = tabs.active

	const header = activeTab?.data?.settings.header

	onMount(() => {
		if (!containerEl || !header) return

		const blockHeader = new Setting(containerEl)
			.addButton((btn) => {
				btn
					.setIcon('clipboard-paste')
					.setTooltip('Paste block')
					.onClick(() => {
						if (!tabs.active) return

						const blockCopy: TBlock = {
							...this.blockCopy,
							id: uuidv4(),
							headerEl: undefined
						}
						const orderCopy: string[] = []

						blockCopy.order
							.map((id) => this.settings.items[id])
							.forEach((item) => {
								const id = uuidv4()
								this.settings.items[id] = {
									...JSON.parse(JSON.stringify(item)),
									id
								}
								orderCopy.push(id)
							})

						blockCopy.order = orderCopy
						blockCopy.type = this.tabs.active?.type

						const copy: ILoggerSettings = JSON.parse(
							JSON.stringify(settings)
						)

						copy.blocks.push(blockCopy)

						save(copy)
					})
			})
			.setDisabled(!this.blockCopy)

		blockHeader
			.addButton((btn) =>
				btn.setButtonText(header.btnText).onClick(() => {
					const id = uuidv4()
					const name = 'New log'

					const copy: ILoggerSettings = JSON.parse(
						JSON.stringify(settings)
					)

					copy.blocks.push({
						id,
						type: activeTab.type,
						name,
						order: []
					})

					save(copy)
				})
			)
			.setClass('daily-logger-blocks-header')
	})
</script>

<div bind:this={containerEl}></div>
