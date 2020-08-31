import { AppThunk } from '../../../state/store'
import { SyncState } from '../../../types/SyncState'
import { syncStateWithPeers, updateGoal } from '../sync'

export const syncStateIfEnabled = (
	syncableState: SyncState
): AppThunk => async (dispatch, getState) => {
	const state = getState()
	const { syncEnabled } = state.sync

	if (syncableState.shouldFollow) {
		// @ts-expect-error
		trace: 'UPDATING GOAL WITH SELF', syncableState
		dispatch(updateGoal(syncableState))
	}

	if (!syncEnabled) return

	dispatch(syncStateWithPeers(syncableState))
}
