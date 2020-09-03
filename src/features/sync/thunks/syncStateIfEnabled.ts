import { AppThunk } from '../../../state/store'
import { SyncState } from '../../../types/SyncState'
import { YouTooLogger } from '../../../util/YouTooLogger'
import { syncStateWithPeers, updateGoal } from '../sync'

const log = YouTooLogger.extend(syncStateIfEnabled.name)

export function syncStateIfEnabled(syncableState: SyncState): AppThunk {
	return async function syncStateIfEnabledExecutor(dispatch, getState) {
		const state = getState()
		const { syncEnabled } = state.sync

		if (syncableState.shouldFollow) {
			log('UPDATING GOAL WITH SELF', syncableState)
			dispatch(updateGoal(syncableState))
		}

		if (!syncEnabled) return

		dispatch(syncStateWithPeers(syncableState))
	}
}
