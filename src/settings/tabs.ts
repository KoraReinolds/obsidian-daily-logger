import { type TTabs } from './types'

export const displayTab = (tabs: TTabs) => {
	if (!tabs.active) return

	tabs.container
		?.querySelectorAll('.daily-logger-tabs li')
		.forEach((li: HTMLElement) => {
			li.classList.toggle(
				'active',
				li.innerText === tabs.active?.name
			)
		})

	if (tabs.contentContainer) {
		tabs.active.render?.(tabs.contentContainer)
	}
}

export const displayTabs = (
	containerEl: HTMLElement,
	tabs: TTabs
) => {
	tabs.container = containerEl.createDiv()
	const ul = tabs.container.createEl('ul', {
		cls: 'daily-logger-tabs '
	})
	tabs.contentContainer = tabs.container.createEl('div')

	for (const tab of tabs.list) {
		const li = ul.createEl('li')
		li.innerHTML = tab.name
		li.addEventListener('click', () => {
			if (tab.render) {
				tabs.active = tab
				displayTab(tabs)
			}
		})
	}

	displayTab(tabs)
}
