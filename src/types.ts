export type SyncState = {
	roomID: string
	userID: string
	videoID: string
	mediaOffset: number
	playerState: PlayerState
	timestamp: number
}

export enum NumericPlayerState {
	UNSTARTED = -1,
	ENDED = 0,
	PLAYING = 1,
	PAUSED = 2,
	BUFFERING = 3,
	CUED = 5,
}

export enum PlayerState {
	UNSTARTED = 'UNSTARTED',
	ENDED = 'ENDED',
	PLAYING = 'PLAYING',
	PAUSED = 'PAUSED',
	BUFFERING = 'BUFFERING',
	CUED = 'CUED',
}

export function toPlayerState(code: NumericPlayerState): PlayerState {
	return NumericPlayerState[code] as PlayerState
}
