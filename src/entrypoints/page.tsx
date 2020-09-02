import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { YouTooApp } from '../components/YouTooApp'
import { YouTubeHeaderButton } from '../components/YouTubeHeaderButton'
import { store } from '../state/store'
import { waitForElement } from '../util/dom/waitForElement'

main()

async function main() {
	trace: 'injecting YouToo topbar UI'

	const youTooRoot = document.createElement('div')
	youTooRoot.id = 'youtoo-topbar-root'

	const createButtonSelector = '#masthead #buttons #button[aria-label="Create"]'
	trace: `waiting for ${createButtonSelector}`

	const createButton = await waitForElement(document, createButtonSelector)
	const buttons = createButton.closest('#buttons')

	buttons.firstChild.before(youTooRoot)

	const youTooApp = new YouTooApp()

	await youTooApp.initialize()

	ReactDOM.render((<Provider store={store}>
		<YouTubeHeaderButton />
	</Provider>), youTooRoot)

	trace: 'YouToo loaded'
}
