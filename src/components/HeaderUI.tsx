import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from '../state/store'
import { waitForElement } from '../util/dom/waitForElement'
import { watchForRemovalFromDocument } from '../util/dom/watchForRemovalFromDocument'
import { baseLog } from '../util/logging'
import { HeaderButton } from './HeaderButton'
import { HeaderDropdown } from './HeaderDropdown'
import './you2watch.css'

const log = baseLog.extend(HeaderUI.name)

export function HeaderUI() {
	const [showDropdown, setShowDropdown] = useState(false)

	const toggleDropdown = () => setShowDropdown(!showDropdown)
	const closeDropdown = () => setShowDropdown(false)

	return (
		<div className="you2watch-header-button-container">
			<Provider store={store}>
				<HeaderButton onHeaderButtonClicked={toggleDropdown} />
				{showDropdown && (
					<HeaderDropdown closeDropdown={closeDropdown} />
				)}
			</Provider>
		</div>
	)
}

export async function mountHeaderUI(): Promise<HTMLDivElement> {
	const you2watchRoot = document.createElement('div')
	you2watchRoot.id = 'you2watch-topbar-root'

	const buttonsSelector = '#masthead #buttons'
	log('waiting for %j', buttonsSelector)

	const buttons = await waitForElement(document, buttonsSelector)

	buttons.firstChild.before(you2watchRoot)

	ReactDOM.render(<HeaderUI />, you2watchRoot)

	log('mounted')

	return you2watchRoot
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
