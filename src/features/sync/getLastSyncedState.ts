import { PeerStates } from '../../types/PeerStates'
import { SyncState } from '../../types/SyncState'

export function getLastSyncedState(syncedStates: PeerStates): SyncState {
	const syncedStatesArr = Object.values(syncedStates)

	if (syncedStatesArr.length === 0) return null

	return syncedStatesArr.reduce((newest: SyncState, other: SyncState) =>
		other.receivedTimestamp > newest.receivedTimestamp ? other : newest
	)
}
