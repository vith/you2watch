import { SyncState } from './SyncState'
import { Config } from './Config'

export type MessagesFromPage =
	| SyncEvent
	| RoomSubscribeRequest
	| RoomUnsubscribeRequest
	| ConfigSetRequest
	| ConfigGetRequest

export type MessagesFromBackground = SyncEvent | ConfigGetResponse

export type SyncEvent = {
	type: 'sync'
	playbackState: SyncState
}

export type RoomSubscribeRequest = {
	type: 'subscribe'
	roomID: string
}

export type RoomUnsubscribeRequest = {
	type: 'unsubscribe'
	roomID: string
}

export type ConfigSetRequest = {
	type: 'config.set'
	items: Partial<Config>
}

export type ConfigGetRequest = {
	type: 'config.get'
	fields: (keyof Config)[]
}

export type ConfigGetResponse = {
	type: 'config.get.response'
	items: Partial<Config>
}
