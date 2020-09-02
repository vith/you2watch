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
import { asyncChromeStorageSyncGet } from '../util/webExtension/asyncChromeStorageSyncGet'

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

			trace: `subscription request to ${roomID} for ${portName}`

			const oldSub = stompSubs.get(roomID)
			if (oldSub) {
				oldSub.ports = [...oldSub.ports, port]
				trace: `added ${portName} to ports for existing subscription to ${roomID}`
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
				trace: `created new subscription to ${roomID} for ${portName}`
			}

			return

			// const oldSub = stompSubs.get(port)
			// if (oldSub) {
			// 	oldSub.subscription.unsubscribe()
			// 	stompSubs.set(port, null)
			// }

			// const roomSub = stompClient.subscribe(
			// 	`/room/${roomID}`,
			// 	stompFrameHandler
			// )

			// stompSubs.set(port, { subscription: roomSub, roomID })

			// return
		}

		case unsubscribeFromRoom.type: {
			const action = event as RoomUnsubscribeAction
			const roomID = action.payload

			const sub = stompSubs.get(roomID)

			const portName = port.name || '<unnamed port>'

			trace: `unsubscribe request for ${sub.roomID} from ${portName}`

			if (!sub) {
				throw new Error('no such subscription exists')
			}

			sub.ports = sub.ports.filter(p => p !== port)

			if (sub.ports.length === 0) {
				trace: `no more ports need subscription to ${roomID}, really unsubscribing`
				sub.subscription.unsubscribe()
				stompSubs.delete(roomID)
			}

			return
		}

		case syncStateWithPeers.type: {
			const action = event as SyncStateWithPeersAction
			const { roomID } = action.payload

			const destination = `/room/${roomID}`

			console.debug(`page->background->${destination}`, event)

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
	trace: 'background: port connected'

	port.onMessage.addListener(pageMessageHandler)

	port.onDisconnect.addListener((disconnectedPort: chrome.runtime.Port) => {
		trace: `port disconnected: ${disconnectedPort.name || '<unnamed port>'}`

		for (const [roomID, subRecord] of stompSubs.entries()) {
			if (subRecord.ports.includes(port)) {
				subRecord.ports = subRecord.ports.filter(p => p !== port)
				if (subRecord.ports.length === 0) {
					trace: `last port gone for subscription to ${roomID}, unsubscribing`
					subRecord.subscription.unsubscribe()
					stompSubs.delete(roomID)
				}
			}
		}

		// unsubscribe from room and forget port
		// const roomSub = stompSubs.get(port)
		// roomSub.subscription.unsubscribe()
		// stompSubs.delete(port)
	})

	// add to ports list
	// stompSubs.set(port, null)
})

function stompFrameHandler(frame: IMessage) {
	const message = JSON.parse(frame.body)
	console.debug('server->background', message)

	const { roomID } = message.payload
	const subRecord = stompSubs.get(roomID)
	if (subRecord) {
		for (const port of subRecord.ports) {
			port.postMessage(message)
		}
	}

	// for (const [port, sub] of stompSubs.entries()) {
	// 	if (sub?.roomID === message.payload.roomID) {
	// 		port.postMessage(message)
	// 	}
	// }
}

stompClient.activate()
