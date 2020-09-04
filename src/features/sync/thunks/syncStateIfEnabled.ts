import { AppThunk } from '../../../state/store'
import { SyncState } from '../../../types/SyncState'
import { baseLog } from '../../../util/logging'
import { syncStateWithPeers, updateGoal } from '../sync'

const log = baseLog.extend(syncStateIfEnabled.name)

export function syncStateIfEnabled(syncableState: SyncState): AppThunk {
	return async function syncStateIfEnabledExecutor(dispatch, getState) {
		const state = getState()
		const { syncEnabled } = state.sync

		if (syncableState.shouldFollow) {
			log('UPDATING GOAL WITH SELF', syncableState)
			dispatch(updateGoal(syncableState))
		}

		if (!syncEnabled) return

		log('SHARING STATE', syncableState)
		dispatch(syncStateWithPeers(syncableState))
	}
}
