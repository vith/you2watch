import { PlaybackVerb } from './PlaybackVerb'

export type VideoID = string
export type PlaybackCursor = number
export type RoomID = string
export type UserID = string
export type SessionID = string
export type UnixTimestamp = number

export type PlayerState = {
	videoID: VideoID
	mediaOffset: PlaybackCursor
	playbackVerb: PlaybackVerb
}

export type SyncState = {
	playerState: PlayerState
	roomID: RoomID
	userID: UserID
	sessionID: SessionID
	peerTimestamp: UnixTimestamp
	receivedTimestamp: UnixTimestamp
	shouldFollow: boolean
}
