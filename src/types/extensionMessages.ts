import {
	RoomSubscribeAction,
	RoomUnsubscribeAction,
	SyncStateWithPeersAction,
} from '../features/sync/sync'
import { Config } from './Config'
import { SyncState } from './SyncState'

export type MessagesFromPage =
	| RoomSubscribeAction
	| RoomUnsubscribeAction
	| SyncStateWithPeersAction
// | RoomSubscribeRequest
// | RoomUnsubscribeRequest
// | ConfigSetRequest
// | ConfigGetRequest

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
