import { createSlice, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit'
import cryptoRandomString from 'crypto-random-string'
import { GlobalStateContainer } from '../../state/notSafeForRedux'
import { RoomID, SessionID, SyncState, VideoID } from '../../types/SyncState'
import { PeerStates } from './PeerStates'

interface SyncSliceState {
	sessionID: SessionID
	peerStates: PeerStates
	goalState: SyncState
	loadingVideoID: VideoID
	syncEnabled: boolean
	buffering: boolean
}

export const syncSlice = createSlice<SyncSliceState, SliceCaseReducers<SyncSliceState>, 'sync'>({
	name: 'sync',
	initialState: {
		sessionID: cryptoRandomString({ length: 12, type: 'distinguishable' }),
		peerStates: {},
		goalState: null,
		loadingVideoID: null,
		syncEnabled: false,
		buffering: false,
	},
	reducers: {
		receiveSyncState: (state, action: PayloadAction<SyncState>) => {
			const peerID = action.payload.sessionID
			state.peerStates[peerID] = action.payload
		},

		loadingVideo: (state, action: PayloadAction<VideoID>) => {
			state.loadingVideoID = action.payload
		},

		subscribeToRoom: (state, action: PayloadAction<RoomID>) => {
			postActionToBackground(state, action)
		},

		unsubscribeFromRoom: (state, action: PayloadAction<RoomID>) => {
			postActionToBackground(state, action)
		},

		syncStateWithPeers: (state, action: PayloadAction<SyncState>) => {
			postActionToBackground(state, action)

			state.peerStates[action.payload.sessionID] = action.payload
		},

		commitSyncEnabledState: (state, action: PayloadAction<boolean>) => {
			state.syncEnabled = action.payload
		},

		updateGoal: (state, action: PayloadAction<SyncState>) => {
			state.goalState = action.payload
		},
	},
})

function postActionToBackground<T>(state: SyncSliceState, action: PayloadAction<T>) {
	const { sessionID } = state
	const { port } = GlobalStateContainer.getState(sessionID)

	port.postMessage(action)
}

export const {
	receiveSyncState,
	loadingVideo,
	subscribeToRoom,
	unsubscribeFromRoom,
	syncStateWithPeers,
	commitSyncEnabledState,
	updateGoal,
} = syncSlice.actions
