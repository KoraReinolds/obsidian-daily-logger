<script lang="ts">
	import type {
		ILoggerSettings,
		TTab,
		TTabs
	} from 'src/settings/types'
	import { S } from './settingsState.svelte'

	const props: {
		tabs: TTabs
		settings: ILoggerSettings
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	const tabs: TTabs = $state(props.tabs)
	S.settings = props.settings
	S.save = (changes: ((s: ILoggerSettings) => void)[]) => {
		const copy = JSON.parse(JSON.stringify(S.settings))
		changes.forEach((f) => f(copy))
		S.settings = copy

		props.save(copy)
	}

	tabs.active = tabs.list[1]

	const setactivetab = (tab: TTab) => {
		tabs.active = tab
		activeComponent = tab.component
	}

	let activeComponent: any = $state(tabs.active.component)

	const getTabCount = (tab: TTab) => {
		const count = S.settings.blocks.filter(
			(block) => block.type === tab.type
		).length

		return count ? `(${count})` : ''
	}
</script>

<div>
	<ul class="daily-logger-tabs">
		{#each tabs.list as tab (tab.name)}
			<li
				class:active={tab === tabs.active}
				onclick={() => setactivetab(tab)}
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
