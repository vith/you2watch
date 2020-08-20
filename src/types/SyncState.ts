import { PlayerState } from './PlayerState'

export type SyncState = {
	roomID: string
	userID: string
	sessionID: string
	videoID: string
	mediaOffset: number
	playerState: PlayerState
	timestamp: number
}
