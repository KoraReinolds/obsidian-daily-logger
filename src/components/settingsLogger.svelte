<script lang="ts">
	import { onMount } from 'svelte'
	import Header from './settingsHeader.svelte'
	import type {
		ILoggerSettings,
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

	onMount(() => {})
</script>

<Header {settings} {tabs} {save} />
<div bind:this={containerEl}></div>
{settings.blocks.length}
