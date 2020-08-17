/* export const PlayerState = {
	codes: {
		unstarted: -1,
		ended: 0,
		playing: 1,
		paused: 2,
		buffering: 3,
		cued: 4,
	},

	unstarted: 'unstarted',
	ended: 'ended',
	playing: 'playing',
	paused: 'paused',
	buffering: 'buffering',
	cued: 'cued',

	fromCode(stateCode: number) {
		const [name, code] = Object.entries(PlayerState.codes).find(
			([name, code]) => code === stateCode
		)
		return name
	},

	getCode(stateName: string) {
		const [name, code] = Object.entries(PlayerState.codes).find(
			([name, code]) => name === stateName
		)
		return code
	},
} */

/* export function equivalentState(playerState1, playerState2) {
	if (playerState1 === PlayerState.buffering)
		playerState1 = PlayerState.paused

	if (playerState2 === PlayerState.buffering)
		playerState2 = PlayerState.paused

	return playerState1 === playerState2
} */
