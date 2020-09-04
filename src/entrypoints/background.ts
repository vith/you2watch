import {
	Client as StompClient,
	IMessage,
	StompSubscription,
} from '@stomp/stompjs'
import {
	RoomSubscribeAction,
	RoomUnsubscribeAction,
	subscribeToRoom,
	syncStateWithPeers,
	SyncStateWithPeersAction,
	unsubscribeFromRoom,
} from '../features/sync/sync'
import {
	configChanged,
	ConfigChangedAction,
	configRequest,
	configResponse,
} from '../state/config'
import { MessagesFromPage } from '../types/extensionMessages'
import { RoomID } from '../types/SyncState'
import { baseLog } from '../util/logging'
import { asyncChromeStorageSyncGet } from '../util/webExtension/asyncChromeStorageSyncGet'

const log = baseLog.extend('background')

const stompClient = new StompClient({
	brokerURL: 'wss://ytsync.de.n3t.work/ws',
})

type RoomSubscriptionRecord = {
	subscription: StompSubscription
	roomID: RoomID
	ports: chrome.runtime.Port[]
}

const stompSubs = new Map<RoomID, RoomSubscriptionRecord>()

async function pageMessageHandler(
	event: MessagesFromPage,
	port: chrome.runtime.Port
) {
	switch (event.type) {
		case subscribeToRoom.type: {
			const action = event as RoomSubscribeAction
			const roomID = action.payload

			const portName = port.name || '<unnamed port>'

			log('subscription request to %j for %j', roomID, portName)

			const oldSub = stompSubs.get(roomID)
			if (oldSub) {
				oldSub.ports = [...oldSub.ports, port]
				log(
					'added %j to ports for existing subscription to %j',
					portName,
					roomID
				)
			} else {
				const subscription = stompClient.subscribe(
					`/room/${roomID}`,
					stompFrameHandler
				)
				stompSubs.set(roomID, {
					subscription,
					roomID,
					ports: [port],
				})
				log('created new subscription to %j for %j', roomID, portName)
			}

			return
		}

		case unsubscribeFromRoom.type: {
			const action = event as RoomUnsubscribeAction
			const roomID = action.payload

			const sub = stompSubs.get(roomID)

			const portName = port.name || '<unnamed port>'

			log('unsubscribe request for %j from %j', roomID, portName)

			if (!sub) {
				throw new Error('no such subscription exists')
			}

			sub.ports = sub.ports.filter(p => p !== port)

			if (sub.ports.length === 0) {
				log(
					'no more ports need subscription to %j, really unsubscribing',
					roomID
				)
				sub.subscription.unsubscribe()
				stompSubs.delete(roomID)
			}

			return
		}

		case syncStateWithPeers.type: {
			const action = event as SyncStateWithPeersAction
			const { roomID } = action.payload

			const destination = `/room/${roomID}`

			log(`page->background->${destination}`, event)

			const body = JSON.stringify(event)
			stompClient.publish({
				destination,
				body,
			})

			return
		}

		case configChanged.type: {
			const action = event as ConfigChangedAction
			chrome.storage.sync.set(action.payload)
			return
		}

		case configRequest.type: {
			const config = await asyncChromeStorageSyncGet(null)
			port.postMessage(configResponse(config))
			return
		}

		default:
			// assertUnreachable(event)
			throw new Error(
				`No handler for page message ${JSON.stringify(event.type)}`
			)
	}
}

chrome.runtime.onConnectExternal.addListener(port => {
	log('background: port connected')

	port.onMessage.addListener(pageMessageHandler)

	port.onDisconnect.addListener((disconnectedPort: chrome.runtime.Port) => {
		const portName = disconnectedPort.name || '<unnamed port>'
		log('port disconnected: %j', portName)

		for (const [roomID, subRecord] of stompSubs.entries()) {
			if (subRecord.ports.includes(port)) {
				subRecord.ports = subRecord.ports.filter(p => p !== port)
				if (subRecord.ports.length === 0) {
					log(
						'last port gone for subscription to %j, unsubscribing',
						roomID
					)
					subRecord.subscription.unsubscribe()
					stompSubs.delete(roomID)
				}
			}
		}
	})
})

function stompFrameHandler(frame: IMessage) {
	const message = JSON.parse(frame.body)
	log('server->background', message)

	const { roomID } = message.payload
	const subRecord = stompSubs.get(roomID)
	if (subRecord) {
		for (const port of subRecord.ports) {
			port.postMessage(message)
		}
	}
}

stompClient.activate()
