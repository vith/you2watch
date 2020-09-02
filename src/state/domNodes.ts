import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SessionID } from '../types/SyncState'
import { YouTubeMoviePlayer } from '../types/YouTubeMoviePlayer'
import { GlobalStateContainer } from './notSafeForRedux'

type FoundMoviePlayerPayload = PayloadAction<{
	sessionID: SessionID
	moviePlayer: YouTubeMoviePlayer
}>

type FoundVideoElementPayload = PayloadAction<{
	sessionID: SessionID
	videoElement: HTMLVideoElement
}>

export const domNodesSlice = createSlice({
	name: 'dom',
	initialState: {
		foundMoviePlayer: false,
		foundVideoElement: false,
	},
	reducers: {
		foundMoviePlayer: (state, action: FoundMoviePlayerPayload) => {
			const { sessionID, moviePlayer } = action.payload
			GlobalStateContainer.setState(sessionID, { moviePlayer })
			state.foundMoviePlayer = true
		},

		foundVideoElement: (state, action: FoundVideoElementPayload) => {
			const { sessionID, videoElement } = action.payload
			GlobalStateContainer.setState(sessionID, { videoElement })
			state.foundVideoElement = true
		},
	},
})

export const { foundMoviePlayer, foundVideoElement } = domNodesSlice.actions
