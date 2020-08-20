import { PlayerState } from '../playerState'
export function equivalentState(playerState1, playerState2) {
	if (playerState1 === PlayerState.buffering)
		playerState1 = PlayerState.paused

	if (playerState2 === PlayerState.buffering)
		playerState2 = PlayerState.paused

	return playerState1 === playerState2
}
