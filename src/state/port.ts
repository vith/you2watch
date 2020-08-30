import { createAction } from '@reduxjs/toolkit'

export const portConnected = createAction('port/connected',
	(sessionID: string) => ({
		payload: { sessionID }
	})
)

export const portDisconnected = createAction('port/disconnected',
	(sessionID: string, reason: string) => ({
		payload: { sessionID, reason }
	})
)

// import { createSlice, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'

// type PortConnectedPayload = {
// 	sessionID: string
// }

// interface PortDisconnectedPayload {
// 	sessionID: string
// 	reason: string
// }

// type ForwardActionPayload = {
// 	action: any // TODO
// }

// export const portSlice = createSlice({
// 	name: 'portToBackground',
// 	initialState: null,
// 	reducers: {
// 		portConnected: (state, action: PayloadAction<PortConnectedPayload>) => {
// 			return action.payload
// 		},
// 		portDisconnected: (state, action: PayloadAction<PortDisconnectedPayload>) => {
// 			return null
// 		},
// 		forwardActionToBackground: (state, action: PayloadAction<ForwardActionPayload>) => {
// 			const port = state
// 			port.postMessage(action)
// 		},
// 	},
// })

// export const { portConnected, portDisconnected, forwardActionToBackground } = portSlice.actions

// export const portReducer = portSlice.reducer
