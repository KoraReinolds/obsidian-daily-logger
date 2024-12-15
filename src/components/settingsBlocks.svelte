<script lang="ts">
	import { v4 as uuidv4 } from 'uuid'
	import Header from './settingsHeader.svelte'
	import Block from './settingsBlock.svelte'
	import {
		ELoggerType,
		type TBlock,
		type TTabs
	} from 'src/settings/types'
	import { S } from './settingsState.svelte'

	const {
		tabs
	}: {
		tabs: TTabs
	} = $props()

	const blocks = $derived(
		S.settings.blocks
			.filter((block) => block.type === tabs.active?.type)
			.sort((a) => {
				return a.type === ELoggerType.LOGGER ? 1 : -1
			})
	)

	const pasteBlock = (block: TBlock | null) => {
		if (!tabs.active || !block) return

		const blockCopy: TBlock = {
			...block,
			id: uuidv4()
		}
		const orderCopy: string[] = []

		blockCopy.order
			.map((id) => S.settings.items[id])
			.forEach((item) => {
				const id = uuidv4()
				S.settings.items[id] = {
					...JSON.parse(JSON.stringify(item)),
					id
				}
				orderCopy.push(id)
			})

		blockCopy.order = orderCopy
		blockCopy.type = tabs.active?.type

		S.save([(s) => s.blocks.push(blockCopy)])
	}

	const addNewBlock = () => {
		const id = uuidv4()
		const name = 'New log'

		S.save([
			(s) => {
				if (!tabs.active) return
				s.blocks.push({
					id,
					type: tabs.active.type,
					name,
					meta: [],
					order: []
				})
			}
		])
	}
</script>

{#if tabs.active}
	<Header
		{addNewBlock}
		pasteBlock={() => pasteBlock(S.blockCopy)}
		activeTab={tabs.active}
	/>
{/if}

<div class="daily-logger-blocks-content">
	{#each blocks as block (block.id)}
		<Block {block} />
	{/each}
</div>
