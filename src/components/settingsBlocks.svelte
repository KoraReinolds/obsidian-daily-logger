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
		save: (
			changes: ((s: ILoggerSettings) => void)[]
		) => Promise<void>
	} = $props()

	let blockCopy: TBlock | null = $state(null)
	let openedBlockId: string = $state('')

	const blocks = $derived(
		settings.blocks.filter(
			(block) => block.type === tabs.active?.type
		)
	)

	const pasteBlock = (block: TBlock | null) => {
		if (!tabs.active || !block) return

		const blockCopy: TBlock = {
			...block,
			id: uuidv4()
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

		save([(s) => s.blocks.push(blockCopy)])
	}

	const addNewBlock = () => {
		const id = uuidv4()
		const name = 'New log'

		save([
			(s) => {
				if (!tabs.active) return
				s.blocks.push({
					id,
					type: tabs.active.type,
					name,
					order: []
				})
			}
		])
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
	{#each blocks as block (block.id)}
		<Block
			{block}
			{settings}
			{openedBlockId}
			{save}
			copyBlock={(block) => (blockCopy = block)}
			openBlock={(id) => (openedBlockId = id)}
		/>
	{/each}
</div>
