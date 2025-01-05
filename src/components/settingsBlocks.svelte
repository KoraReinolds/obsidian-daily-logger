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
				console.log(tabs)
				s.blocks.unshift({
					id,
					sectionName: '',
					type: tabs.active.type,
					groups: {
						//[ELoggerType.LOGGER]: true,
						//[ELoggerType.TEMPLATE]: true
					},
					name,
					meta: [],
					order: []
				})
				S.openedBlockId = id
			}
		])
	}
</script>

{#if tabs.active}
	<Header
		{addNewBlock}
		pasteBlock={() => pasteBlock(S.blockCopy)}
		activeTab={tabs.active}
		renameGroup={(value) => {
			S.save([
				(s) => {
					if (!s.tabs.active) return

					const tab = tabs.active

					if (tab) {
						tab.name = value
						s.tabs.data[s.tabs.active.type] = tab
					}
				}
			])
		}}
		removeGroup={() => {
			S.save([
				(s) => {
					if (!tabs.active) return

					delete s.tabs.data[tabs.active.type]
					s.tabs.order = s.tabs.order.filter(
						(id) => id !== tabs.active?.type
					)
					const newActiveId = s.tabs.order[0]
					s.tabs.active = s.tabs.data[newActiveId]

					tabs.active = s.tabs.active
					tabs.data = s.tabs.data
					tabs.order = s.tabs.order
				}
			])
		}}
	/>
{/if}

<div class="daily-logger-blocks-content">
	{#each blocks as block (block.id)}
		<Block {block} />
	{/each}
</div>
