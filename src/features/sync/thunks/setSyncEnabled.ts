import { GlobalStateContainer } from "../../../state/notSafeForRedux"
import { AppThunk } from '../../../state/store'
import { commitSyncEnabledState, subscribeToRoom, syncStateWithPeers, unsubscribeFromRoom } from '../sync'
import { createSyncableState, getCurrentPlayerState } from "../../../util/moviePlayer/getCurrentPlayerState"

export const setSyncEnabled = (enabled: boolean): AppThunk =>
	async (dispatch, getState) => {
		const state = getState()
		const { sessionID } = state.sync
		const { roomID } = state.config

		const playerState = getCurrentPlayerState(sessionID)

		if (enabled) {
			dispatch(subscribeToRoom(roomID))
			dispatch(syncStateWithPeers(
				createSyncableState(playerState, state)
			))
		} else {
			dispatch(unsubscribeFromRoom(roomID))
		}

		dispatch(commitSyncEnabledState(enabled))
	}
