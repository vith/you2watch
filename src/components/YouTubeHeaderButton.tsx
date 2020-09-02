import { SyncOutlined } from '@ant-design/icons'
import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { store } from '../state/store'
import { waitForElement } from '../util/dom/waitForElement'
import { watchForRemovalFromDocument } from '../util/dom/watchForRemovalFromDocument'
import { YouTooDropdown } from './YouTooDropdown'
import './YouTubeHeaderButton.css'

export function YouTubeHeaderButton() {
	const ref = useRef(null)

	useEffect(() => {
		watchForRemovalFromDocument(ref.current).then(
			async (removalMutation: MutationRecord) => {
				warn: 'YouTubeHeaderButton was removed from DOM. Reinjecting.'
				await mountHeaderButton()
			}
		)
	}, [ref])

	return (
		<Provider store={store}>
			<div className="youtoo-header-button" ref={ref}>
				<SyncOutlined style={{ fontSize: '16px' }} />
				<YouTooDropdown />
			</div>
		</Provider>
	)
}

export async function mountHeaderButton() {
	const youTooRoot = document.createElement('div')
	youTooRoot.id = 'youtoo-topbar-root'

	const createButtonSelector = '#masthead #buttons #button[aria-label="Create"]'
	trace: `waiting for ${createButtonSelector}`

	const createButton = await waitForElement(document, createButtonSelector)
	const buttons = createButton.closest('#buttons')

	buttons.firstChild.before(youTooRoot)

	ReactDOM.render(<YouTubeHeaderButton />, youTooRoot)
}
