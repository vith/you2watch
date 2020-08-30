import { SyncState } from '../../types/SyncState'
import { PeerStates } from './PeerStates'

export function getLastSyncedState(syncedStates: PeerStates): SyncState {
	const syncedStatesArr = Object.values(syncedStates)

	if (syncedStatesArr.length === 0)
		return null

	return syncedStatesArr.reduce(
		(newest: SyncState, other: SyncState) =>
			other.receivedTimestamp > newest.receivedTimestamp ? other : newest
	)
}
