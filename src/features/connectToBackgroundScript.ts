import { portDisconnected } from '../state/port'
import { AppDispatch } from '../state/store'
import { MessagesFromBackground } from '../types/extensionMessages'
import { findExtensionID } from '../util/webExtension/findExtensionID'
import { syncStateWithPeers, receiveSyncState } from './sync/sync'
import { handleSyncEvent } from './sync/handleReceivedSync'

export function connectToBackgroundScript(dispatch: AppDispatch, sessionID: string) {
	const extensionID = findExtensionID()

	const port = chrome.runtime.connect(extensionID)

	function onPortDisconnect(port: chrome.runtime.Port) {
		const reason = chrome.runtime.lastError?.message
		dispatch(portDisconnected(sessionID, reason))
	}

	function onPortMessage(event: MessagesFromBackground) {
		// console.log('onPortMessage', event)
		if (syncStateWithPeers.match(event)) {
			dispatch(handleSyncEvent(event.payload))
			// dispatch(receiveSyncState(event.payload))
		}
	}

	port.onDisconnect.addListener(onPortDisconnect)
	port.onMessage.addListener(onPortMessage)

	return port
}




