<script lang="ts">
	import { v4 as uuidv4 } from 'uuid'
	import {
		ELoggerType,
		type ILoggerSettings,
		type TTab,
		type TTabs
	} from 'src/settings/types'
	import General from '../components/settingsGeneral.svelte'
	import Blocks from '../components/settingsBlocks.svelte'
	import { S } from './settingsState.svelte'
	import { onMount } from 'svelte'
	import Sortable from 'sortablejs'
	import { moveElement } from 'src/lib/string'

	const props: {
		settings: ILoggerSettings
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	const getComponent = (type: ELoggerType) => {
		return (
			{
				[ELoggerType.GENERAL]: General,
				[ELoggerType.LOGGER]: Blocks,
				[ELoggerType.TEMPLATE]: Blocks
			}[type] || Blocks
		)
	}

	const tabs: TTabs = $state(props.settings.tabs)

	$effect(() => {
		tabs.list = tabs.order.map((id) => tabs.data[id])
	})

	tabs.active = tabs.data[ELoggerType.LOGGER]

	const addNewGroup = () => {
		const id = uuidv4()

		tabs.data[id] = {
			type: id as ELoggerType,
			name: 'New group' + Math.random(),
			data: {
				settings: {
					header: {
						remove: true,
						rename: true
					}
				}
			}
		}
		tabs.order.unshift(id)
		tabs.active = tabs.data[id]
		S.save([
			(s) => {
				s.tabs = tabs
			}
		])
	}

	S.settings = props.settings
	S.save = (changes: ((s: ILoggerSettings) => void)[]) => {
		const copy = JSON.parse(JSON.stringify(S.settings))
		changes.forEach((f) => f(copy))
		S.settings = copy

		props.save(copy)
	}

	const setActiveTab = (tab: TTab) => {
		tabs.active = tab
	}

	$effect(() => {
		if (tabs.active) {
			activeComponent = getComponent(tabs.active.type)
		}
	})

	let activeComponent: any = $state(
		getComponent(tabs.active.type)
	)

	const getTabCount = (tab: TTab) => {
		const count = S.settings.blocks.filter(
			(block) => block.type === tab.type
		).length

		return count ? `(${count})` : ''
	}

	let listEl: HTMLElement

	onMount(() => {
		if (!listEl) return

		Sortable.create(listEl, {
			onEnd: (evt) => {
				S.save([
					(s) => {
						const oldIndex = evt.oldDraggableIndex
						const newIndex = evt.newDraggableIndex

						s.tabs.order = moveElement(
							s.tabs.order,
							oldIndex,
							newIndex
						)

						tabs.order = s.tabs.order
					}
				])
			}
		})
	})
</script>

<div>
	<ul bind:this={listEl} class="daily-logger-tabs">
		<li
			class="daily-logger-tabs-btn active"
			onclick={() => addNewGroup()}
		>
			+
		</li>
		{#each tabs.list as tab (tab.name)}
			<li
				class:active={tab?.type === tabs.active?.type}
				onclick={() => setActiveTab(tab)}
			>
				{tab.name}
				{getTabCount(tab)}
			</li>
		{/each}
	</ul>

	<div class="daily-logger-block">
		{#if activeComponent}
			{@const Component = activeComponent}
			{#key tabs.active?.type}
				<Component {tabs} />
			{/key}
		{/if}
	</div>
</div>
