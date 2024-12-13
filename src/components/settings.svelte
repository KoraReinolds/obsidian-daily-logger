<script lang="ts">
	import type {
		ILoggerSettings,
		TTab,
		TTabs
	} from 'src/settings/types'

	const props: {
		tabs: TTabs
		settings: ILoggerSettings
		save: (settings: ILoggerSettings) => Promise<void>
	} = $props()

	const tabs: TTabs = $state(props.tabs)
	let settings: ILoggerSettings = $state(props.settings)
	tabs.active = tabs.list[1]

	const setactivetab = (tab: TTab) => {
		tabs.active = tab
		activeComponent = tab.component
	}

	let activeComponent: any = $state(tabs.active.component)
</script>

<div>
	<ul class="daily-logger-tabs">
		{#each tabs.list as tab (tab.name)}
			<li
				class:active={tab === tabs.active}
				onclick={() => setactivetab(tab)}
			>
				{tab.name}
			</li>
		{/each}
	</ul>

	<div class="daily-logger-block">
		{#if activeComponent}
			{@const Component = activeComponent}
			{#key tabs.active?.type}
				<Component
					{settings}
					{tabs}
					save={(newSettings: ILoggerSettings) => {
						settings = newSettings
						props.save(newSettings)
					}}
				/>
			{/key}
		{/if}
	</div>
</div>
