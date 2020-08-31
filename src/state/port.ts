import { createAction } from '@reduxjs/toolkit'

// Not storing the port object in redux because it'll recursively crawl all
// accessible properties on it to track changes. Instead it can be accessed
// through GlobalStateContainer by the sessionID.

export const portConnected = createAction(
	'port/connected',
	(sessionID: string) => ({
		payload: { sessionID },
	})
)

export const portDisconnected = createAction(
	'port/disconnected',
	(sessionID: string, reason: string) => ({
		payload: { sessionID, reason },
	})
)
