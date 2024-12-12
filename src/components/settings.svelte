<script lang="ts">
	import type { TTab, TTabs } from 'src/settings/types'

	const props: { tabs: TTabs } = $props()

	const tabs: TTabs = $state(props.tabs)
	tabs.active = tabs.list[1]

	const setactivetab = (tab: TTab) => {
		tabs.active = tab
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
			</li>
		{/each}
	</ul>
</div>
