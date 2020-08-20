import 'fomantic-ui-css/semantic.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { SyncUI } from './components/SyncUI'
import { waitForElement } from './util/wait-for-element'

async function main() {
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

main()
