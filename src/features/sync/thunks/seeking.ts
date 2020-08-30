import { AppThunk } from '../../../state/store'
import { isSeekInitiatedByUser } from '../../../types/userIntentionDetectors'
import { createSyncableState, getCurrentPlayerState } from '../../../util/moviePlayer/getCurrentPlayerState'
import { syncStateIfEnabled } from './syncStateIfEnabled'

export const seeking = (seekingEvent: Event): AppThunk => (dispatch, getState) => {
	const state = getState()
	const { sessionID, goalState } = state.sync

	const newPlayerState = getCurrentPlayerState(sessionID)

	console.debug('onSeeking', seekingEvent, newPlayerState)

	const { byUser, decidedBy, reason } = isSeekInitiatedByUser(
		seekingEvent,
		newPlayerState,
		goalState.playerState
	)

	if (!byUser) {
		trace: `IGNORE seeking ${seekingEvent} due to: ${reason} (${decidedBy})`
		return
	}

	const syncableState = createSyncableState(newPlayerState, state)

	dispatch(syncStateIfEnabled(syncableState))
}
