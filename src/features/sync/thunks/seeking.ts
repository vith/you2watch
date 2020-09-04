import { AppThunk } from '../../../state/store'
import { isSeekInitiatedByUser } from '../../../types/userIntentionDetectors'
import { baseLog } from '../../../util/logging'
import {
	createSyncableState,
	getCurrentPlayerState,
} from '../../../util/moviePlayer/getCurrentPlayerState'
import { syncStateIfEnabled } from './syncStateIfEnabled'

const log = baseLog.extend(seeking.name)

export function seeking(seekingEvent: Event): AppThunk {
	return function seekingExecutor(dispatch, getState) {
		const state = getState()
		const { sessionID, goalState } = state.sync

		const newPlayerState = getCurrentPlayerState(sessionID)

		log('onSeeking', seekingEvent, newPlayerState)

		const { byUser, decidedBy, reason } = isSeekInitiatedByUser(
			seekingEvent,
			newPlayerState,
			goalState.playerState
		)

		if (!byUser) {
			log(
				'IGNORE seeking %o due to: %s (%s)',
				seekingEvent,
				reason,
				decidedBy
			)
			return
		}

		const syncableState = createSyncableState(newPlayerState, state)

		dispatch(syncStateIfEnabled(syncableState))
	}
}
