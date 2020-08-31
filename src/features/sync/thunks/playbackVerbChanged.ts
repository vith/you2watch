import { AppThunk } from '../../../state/store'
import { PlaybackVerb } from '../../../types/PlaybackVerb'
import { isStateChangeInitiatedByUser } from '../../../types/userIntentionDetectors'
import {
	createSyncableState,
	getCurrentPlayerState,
} from '../../../util/moviePlayer/getCurrentPlayerState'
import { loadingVideo } from '../sync'
import { syncStateIfEnabled } from './syncStateIfEnabled'

export const playbackVerbChanged = (
	newPlaybackVerb: PlaybackVerb
): AppThunk => async (dispatch, getState) => {
	const state = getState()
	const { goalState, loadingVideoID, sessionID } = state.sync
	const newPlayerState = getCurrentPlayerState(sessionID)

	// special case: during navigation to new video
	if (loadingVideoID) {
		if (newPlayerState.videoID !== loadingVideoID) {
			return // ignore events for old video ID (racey)
		} else {
			// anticipated video is now loaded
			dispatch(loadingVideo({ videoID: null }))
		}
	}

	const syncableState = createSyncableState(newPlayerState, state)

	if (goalState) {
		const { byUser, decidedBy, reason } = isStateChangeInitiatedByUser(
			newPlaybackVerb,
			newPlayerState,
			goalState.playerState
		)

		syncableState.shouldFollow = byUser

		if (!byUser) {
			trace: `[${decidedBy}] IGNORE onStateChange ${newPlaybackVerb}: ${reason}`
		}
	}

	dispatch(syncStateIfEnabled(syncableState))
}
