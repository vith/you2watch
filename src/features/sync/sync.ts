import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import cryptoRandomString from 'crypto-random-string'
import { PeerStates } from '../../types/PeerStates'
import { RoomID, SessionID, SyncState, VideoID } from '../../types/SyncState'

interface SyncSliceState {
	sessionID: SessionID
	peerStates: PeerStates
	goalState: SyncState
	loadingVideoID: VideoID
	syncEnabled: boolean
	buffering: boolean
}

const initialState: SyncSliceState = {
	sessionID: cryptoRandomString({ length: 12, type: 'distinguishable' }),
	peerStates: {},
	goalState: null,
	loadingVideoID: null,
	syncEnabled: false,
	buffering: false,
}

export type ReceiveSyncAction = PayloadAction<SyncState>
export type LoadingVideoAction = PayloadAction<VideoID>
export type RoomSubscribeAction = PayloadAction<RoomID>
export type RoomUnsubscribeAction = PayloadAction<RoomID>
export type SyncStateWithPeersAction = PayloadAction<SyncState>
export type SyncToggledAction = PayloadAction<boolean>
export type UpdateGoalAction = PayloadAction<SyncState>

export const syncSlice = createSlice({
	name: 'sync',
	initialState,
	reducers: {
		receiveSyncState: (state, action: ReceiveSyncAction) => {
			const peerID = action.payload.sessionID
			state.peerStates[peerID] = action.payload
		},

		loadingVideo: (state, action: LoadingVideoAction) => {
			state.loadingVideoID = action.payload
		},

		subscribeToRoom: (state, action: RoomSubscribeAction) => {},

		unsubscribeFromRoom: (state, action: RoomUnsubscribeAction) => {},

		syncStateWithPeers: (state, action: SyncStateWithPeersAction) => {
			state.peerStates[action.payload.sessionID] = action.payload
		},

		syncToggled: (state, action: SyncToggledAction) => {
			state.syncEnabled = action.payload
		},

		updateGoal: (state, action: UpdateGoalAction) => {
			state.goalState = action.payload
		},
	},
})

export const {
	receiveSyncState,
	loadingVideo,
	subscribeToRoom,
	unsubscribeFromRoom,
	syncStateWithPeers,
	syncToggled,
	updateGoal,
} = syncSlice.actions
