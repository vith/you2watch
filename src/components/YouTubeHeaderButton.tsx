import { SyncOutlined } from '@ant-design/icons'
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from '../state/store'
import { waitForElement } from '../util/dom/waitForElement'
import { watchForRemovalFromDocument } from '../util/dom/watchForRemovalFromDocument'
import { YouTooLogger } from '../util/YouTooLogger'
import { YouTooDropdown } from './YouTooDropdown'
import './YouTubeHeaderButton.css'

const log = YouTooLogger.extend(YouTubeHeaderButton.name)

export function YouTubeHeaderButton() {
	const ref = useRef(null)
	const [showDropdown, setShowDropdown] = useState(true)

	function autoRemountEffect() {
		async function autoRemount() {
			const mutationRecord = await watchForRemovalFromDocument(
				ref.current
			)
			await mountHeaderButton(mutationRecord)
		}

		autoRemount()
	}

	useEffect(autoRemountEffect, [ref])

	const maybeDropDown = showDropdown ? <YouTooDropdown /> : null

	return (
		<Provider store={store}>
			<div className="youtoo-header-button-container">
				<button className="youtoo-header-button" ref={ref}>
					<span>Sync</span>
					<SyncOutlined style={{ fontSize: '16px' }} />
				</button>
				{maybeDropDown}
			</div>
		</Provider>
	)
}

export async function mountHeaderButton(mutationRecord?: MutationRecord) {
	if (mutationRecord)
		log('detected removal from DOM. reinjecting', mutationRecord)

	const youTooRoot = document.createElement('div')
	youTooRoot.id = 'youtoo-topbar-root'

	const createButtonSelector =
		'#masthead #buttons #button[aria-label="Create"]'
	log('waiting for', createButtonSelector)

	const createButton = await waitForElement(document, createButtonSelector)
	const buttons = createButton.closest('#buttons')

	buttons.firstChild.before(youTooRoot)

	ReactDOM.render(<YouTubeHeaderButton />, youTooRoot)

	log('mounted')
}
