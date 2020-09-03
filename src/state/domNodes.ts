import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SessionID } from '../types/SyncState'
import { YouTubeMoviePlayer } from '../types/YouTubeMoviePlayer'
import { querySelectorOne } from '../util/dom/querySelectorOne'
import { waitForElement } from '../util/dom/waitForElement'
import { GlobalStateContainer } from './notSafeForRedux'
import { AppStore } from './store'

type FoundMoviePlayerPayload = PayloadAction<SessionID>
type FoundVideoElementPayload = PayloadAction<SessionID>

export const domNodesSlice = createSlice({
	name: 'dom',
	initialState: {
		foundMoviePlayer: false,
		foundVideoElement: false,
	},
	reducers: {
		foundMoviePlayer: (state, action: FoundMoviePlayerPayload) => {
			state.foundMoviePlayer = true
		},

		foundVideoElement: (state, action: FoundVideoElementPayload) => {
			state.foundVideoElement = true
		},
	},
})

export const { foundMoviePlayer, foundVideoElement } = domNodesSlice.actions

export async function findMoviePlayer(
	searchRoot: Node & ParentNode,
	store: AppStore
): Promise<YouTubeMoviePlayer> {
	const { dispatch, getState } = store
	const { sessionID } = getState().sync

	const moviePlayer = (await waitForElement(
		searchRoot,
		'#movie_player'
	)) as YouTubeMoviePlayer

	GlobalStateContainer.setState(sessionID, { moviePlayer })
	dispatch(foundMoviePlayer(sessionID))

	return moviePlayer
}

export async function findVideoElement(
	moviePlayer: YouTubeMoviePlayer,
	store: AppStore
): Promise<HTMLVideoElement> {
	const { dispatch, getState } = store
	const { sessionID } = getState().sync

	const videoElement = querySelectorOne(
		moviePlayer,
		'video'
	) as HTMLVideoElement

	GlobalStateContainer.setState(sessionID, { videoElement })
	dispatch(foundVideoElement(sessionID))

	return videoElement
}
