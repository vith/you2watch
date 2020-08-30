import { GlobalStateContainer } from '../../state/notSafeForRedux'
import { RootState } from '../../state/rootReducer'
import { PlayerState, SyncState, UnixTimestamp } from '../../types/SyncState'
import { getCurrentPlaybackVerb } from './getCurrentPlaybackVerb'
import { getCurrentVideoID } from './getCurrentVideoID'

export function createSyncableState(playerState: PlayerState, reduxState: RootState): SyncState {
	const { roomID, userID } = reduxState.config
	const { sessionID } = reduxState.sync
	const peerTimestamp = Date.now()
	const receivedTimestamp: UnixTimestamp = null
	const shouldFollow = true

	return {
		roomID,
		userID,
		sessionID,
		playerState,
		peerTimestamp,
		receivedTimestamp,
		shouldFollow,
	}
}

export function getCurrentPlayerState(sessionID: string): PlayerState {
	const { moviePlayer } = GlobalStateContainer.getState(sessionID)

	const videoID = getCurrentVideoID(moviePlayer)
	const mediaOffset = moviePlayer.getCurrentTime()
	const playbackVerb = getCurrentPlaybackVerb(moviePlayer)

	return {
		videoID,
		mediaOffset,
		playbackVerb,
	}
}


