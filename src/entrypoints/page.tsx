import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { YouTooApp } from '../components/YouTooApp'
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

	ReactDOM.render((<Provider store={store}>
		<YouTooApp />
	</Provider>), youTooRoot)

	trace: 'YouToo loaded'
}


/* async function oldComponent() {
	trace: 'loading sync runtime'

	const syncUiMountPoint = document.createElement('div')
	syncUiMountPoint.id = 'sync-ui'

	trace: 'waiting for #primary-inner > #info'
	// search for #info under #primary-inner because youtube frontend has 5 different #info elements...
	// const infoElm: Element = await waitForElement(document, '#primary-inner > #info')
	const htmlElm: Element = await waitForElement(document, 'html')
	trace: 'found html'
	const primaryInnerElm: Element = await waitForElement(htmlElm, '#primary-inner')
	trace: 'found #primary-inner'
	const infoElm: Element = await waitForElement(primaryInnerElm, '#primary-inner > #info')
	trace: 'found #primary-inner > #info'

	infoElm.parentNode.insertBefore(syncUiMountPoint, infoElm)

	ReactDOM.render(<SyncUI />, syncUiMountPoint)

	trace: 'sync runtime loaded'
} */

// oldComponent()
