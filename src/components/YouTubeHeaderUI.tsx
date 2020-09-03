import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from '../state/store'
import { waitForElement } from '../util/dom/waitForElement'
import { watchForRemovalFromDocument } from '../util/dom/watchForRemovalFromDocument'
import { YouTooLogger } from '../util/YouTooLogger'
import { YouTooDropdown } from './YouTooDropdown'
import { YouTubeHeaderButton } from './YouTubeHeaderButton'
const log = YouTooLogger.extend(YouTubeHeaderUI.name)

export function YouTubeHeaderUI() {
	const [showDropdown, setShowDropdown] = useState(false)

	const toggleDropdown = () => setShowDropdown(!showDropdown)
	const closeDropdown = () => setShowDropdown(false)

	return (
		<div className="youtoo-header-button-container">
			<Provider store={store}>
				<YouTubeHeaderButton onHeaderButtonClicked={toggleDropdown} />
				{showDropdown && (
					<YouTooDropdown closeDropdown={closeDropdown} />
				)}
			</Provider>
		</div>
	)
}

export async function mountHeaderUI(): Promise<HTMLDivElement> {
	const youTooRoot = document.createElement('div')
	youTooRoot.id = 'youtoo-topbar-root'

	const createButtonSelector =
		'#masthead #buttons #button[aria-label="Create"]'
	log('waiting for', createButtonSelector)

	const createButton = await waitForElement(document, createButtonSelector)
	const buttons = createButton.closest('#buttons')

	buttons.firstChild.before(youTooRoot)

	ReactDOM.render(<YouTubeHeaderUI />, youTooRoot)

	log('mounted')

	return youTooRoot
}

export async function tenaciouslyMountHeaderUI() {
	const mountPoint = await mountHeaderUI()
	const mutationRecord = watchForRemovalFromDocument(mountPoint)
	mutationRecord.then(() => {
		log(
			'detected removal from DOM. cleaning up and reinjecting',
			mutationRecord
		)
		ReactDOM.unmountComponentAtNode(mountPoint)
		tenaciouslyMountHeaderUI()
	})
}
