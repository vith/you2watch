import { AppThunk } from '../../../state/store'
import {
	createSyncableState,
	getCurrentPlayerState,
} from '../../../util/moviePlayer/getCurrentPlayerState'
import {
	subscribeToRoom,
	syncStateWithPeers,
	syncToggled,
	unsubscribeFromRoom,
} from '../sync'

export const toggleSync = (enabled: boolean): AppThunk => async (
	dispatch,
	getState
) => {
	const state = getState()
	const { sessionID } = state.sync
	const { roomID } = state.config

	const playerState = getCurrentPlayerState(sessionID)

	if (enabled) {
		dispatch(subscribeToRoom(roomID))
		dispatch(syncStateWithPeers(createSyncableState(playerState, state)))
	} else {
		dispatch(unsubscribeFromRoom(roomID))
	}

	dispatch(syncToggled(enabled))
}
