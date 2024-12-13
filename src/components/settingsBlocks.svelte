<script lang="ts">
	import { v4 as uuidv4 } from 'uuid'
	import Header from './settingsHeader.svelte'
	import Block from './settingsBlock.svelte'
	import type {
		ILoggerSettings,
		TBlock,
		TTabs
	} from 'src/settings/types'

	const {
		settings,
		tabs,
		save
	}: {
		settings: ILoggerSettings
		tabs: TTabs
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	let blockCopy: TBlock | null = $state(null)

	const blocks = $derived(
		settings.blocks.filter(
			(block) => block.type === tabs.active?.type
		)
	)

	const pasteBlock = (block: TBlock | null) => {
		if (!tabs.active || !block) return

		const blockCopy: TBlock = {
			...block,
			id: uuidv4(),
			headerEl: undefined
		}
		const orderCopy: string[] = []

		blockCopy.order
			.map((id) => settings.items[id])
			.forEach((item) => {
				const id = uuidv4()
				settings.items[id] = {
					...JSON.parse(JSON.stringify(item)),
					id
				}
				orderCopy.push(id)
			})

		blockCopy.order = orderCopy
		blockCopy.type = tabs.active?.type

		const copy: ILoggerSettings = JSON.parse(
			JSON.stringify(settings)
		)

		copy.blocks.push(blockCopy)

		save(copy)
	}

	const addNewBlock = () => {
		const id = uuidv4()
		const name = 'New log'

		const copy: ILoggerSettings = JSON.parse(
			JSON.stringify(settings)
		)

		if (!tabs.active) return

		copy.blocks.push({
			id,
			type: tabs.active.type,
			name,
			order: []
		})

		save(copy)
	}
</script>

{#if tabs.active}
	<Header
		{addNewBlock}
		pasteBlock={() => pasteBlock(blockCopy)}
		canPaste={!!blockCopy}
		activeTab={tabs.active}
	/>
{/if}

<div class="daily-logger-blocks-content">
	{#each blocks as block}
		<Block
			{block}
			{settings}
			copyBlock={(block: TBlock) => (blockCopy = block)}
		/>
	{/each}
</div>
