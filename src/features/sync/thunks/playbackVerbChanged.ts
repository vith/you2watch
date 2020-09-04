import { AppThunk } from '../../../state/store'
import { PlaybackVerb } from '../../../types/PlaybackVerb'
import { isStateChangeInitiatedByUser } from '../../../types/userIntentionDetectors'
import { baseLog } from '../../../util/logging'
import {
	createSyncableState,
	getCurrentPlayerState,
} from '../../../util/moviePlayer/getCurrentPlayerState'
import { loadingVideo } from '../sync'
import { handleSyncEvent } from './handleReceivedSync'
import { syncStateIfEnabled } from './syncStateIfEnabled'

const log = baseLog.extend(playbackVerbChanged.name)

export function playbackVerbChanged(newPlaybackVerb: PlaybackVerb): AppThunk {
	return async function playbackVerbChangedExecutor(dispatch, getState) {
		const state = getState()
		const { goalState, loadingVideoID, sessionID } = state.sync
		const newPlayerState = getCurrentPlayerState(sessionID)

		// special case: during navigation to new video
		if (loadingVideoID) {
			if (newPlayerState.videoID !== loadingVideoID) {
				return // ignore events for old video ID (racey)
			} else {
				// anticipated video is now loaded.

				// clear loadingVideoID field
				dispatch(loadingVideo(null))

				// re-dispatch last goal state, to sync to it now that we have the
				// right video loaded
				dispatch(handleSyncEvent(state.sync.goalState))
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
				log(
					'[%s] IGNORE onStateChange %s: %s',
					decidedBy,
					newPlaybackVerb,
					reason
				)
			}
		}

		dispatch(syncStateIfEnabled(syncableState))
	}
}
