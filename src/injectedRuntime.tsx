import 'fomantic-ui-css/semantic.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { SyncUI } from './components/SyncUI'
import { waitForElement } from './util/wait-for-element'
import { YouTubeHeaderButton } from './components/YouTubeHeaderButton'

async function oldComponent() {
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
}

// oldComponent()

async function loadTopBarUI() {
	trace: 'injecting YouToo topbar UI'

	const youTooRoot = document.createElement('div')
	youTooRoot.id = 'youtoo-topbar-root'

	// const logoSelector = '#masthead #start #logo'
	// const parentSelector = '#masthead #buttons'
	const createButtonSelector = '#masthead #buttons #button[aria-label="Create"]'
	trace: `waiting for ${createButtonSelector}`
	// const buttons = await waitForElement(document, parentSelector)
	const createButton = await waitForElement(document, createButtonSelector)
	const buttons = createButton.closest('#buttons')

	// buttons.insertBefore(youTooMountPoint, buttons.firstChild)
	// createButton.before(youTooRoot)
	buttons.firstChild.before(youTooRoot)

	ReactDOM.render(<YouTubeHeaderButton />, youTooRoot)

	trace: 'YouToo loaded'
}

loadTopBarUI()
