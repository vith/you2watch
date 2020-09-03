import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { syncStateWithPeers } from '../features/sync/sync'
import { handleSyncEvent } from '../features/sync/thunks/handleReceivedSync'
import { MessagesFromBackground } from '../types/extensionMessages'
import { findExtensionID } from '../util/webExtension/findExtensionID'
import { GlobalStateContainer } from './notSafeForRedux'
import { AppDispatch, RootState } from './store'

// Not storing the port object in redux because it'll recursively crawl all
// accessible properties on it to track changes. Instead it can be accessed
// through GlobalStateContainer by the sessionID.

type PortDisconnectedReason = string
type PortDisconnectedAction = PayloadAction<PortDisconnectedReason>

export const portSlice = createSlice({
	name: 'port',
	initialState: {
		isConnected: false,
	},
	reducers: {
		portConnected: state => {
			state.isConnected = true
		},
		portDisconnected: (state, action: PortDisconnectedAction) => {
			state.isConnected = false
		},
	},
})

export const { portConnected, portDisconnected } = portSlice.actions

export function connectToBackgroundScript(
	dispatch: AppDispatch,
	getState: () => RootState
) {
	const { sessionID } = getState().sync

	const extensionID = findExtensionID()

	const port = chrome.runtime.connect(extensionID)

	function onPortDisconnect(port: chrome.runtime.Port) {
		const reason = chrome.runtime.lastError?.message
		dispatch(portDisconnected(reason))
	}

	function onPortMessage(event: MessagesFromBackground) {
		if (syncStateWithPeers.match(event)) {
			dispatch(handleSyncEvent(event.payload))
		}
	}

	port.onDisconnect.addListener(onPortDisconnect)
	port.onMessage.addListener(onPortMessage)

	GlobalStateContainer.setState(sessionID, { port })
	dispatch(portConnected())

	return port
}
