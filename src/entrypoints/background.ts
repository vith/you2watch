import {
	Client as StompClient,
	IMessage,
	StompSubscription,
} from '@stomp/stompjs'
import cryptoRandomString from 'crypto-random-string'
import {
	subscribeToRoom,
	syncStateWithPeers,
	unsubscribeFromRoom,
} from '../features/sync/sync'
import {
	changeConfig,
	configChanged,
	configLoaded,
	requestFromBackground,
} from '../state/config'
import { Config } from '../types/Config'
import { MessagesFromPage } from '../types/extensionMessages'
import { RoomID } from '../types/SyncState'
import { baseLog } from '../util/logging'
import { missingProperties } from '../util/object'
import { assertUnreachable } from '../util/typescript/assertUnreachable'
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

const stompSubsByRoom = new Map<RoomID, RoomSubscriptionRecord>()
const allPorts = new Set<chrome.runtime.Port>()

main()

async function main() {
	stompClient.activate()

	// provide random defaults in config if missing
	await initializeConfig()

	registerEventHandlers()
}

async function initializeConfig() {
	const savedConfig = await asyncChromeStorageSyncGet(null)
	const defaults: Config = {
		get userID() {
			return cryptoRandomString({ length: 8, type: 'distinguishable' })
		},
		get roomID() {
			return cryptoRandomString({ length: 8, type: 'distinguishable' })
		},
	}

	const missing = missingProperties(savedConfig, defaults)

	if (Object.keys(missing).length > 0) {
		log(
			'some required config fields were unset. generating defaults:',
			missing
		)
		chrome.storage.sync.set(missing)
	}
}

function registerEventHandlers() {
	chrome.storage.onChanged.addListener(
		(
			changes: { [key: string]: chrome.storage.StorageChange },
			areaName: string
		) => {
			if (areaName !== 'sync') return

			log('chrome.storage.sync onChanged', changes)

			const configChangedAction = configChanged(changes)

			for (const port of allPorts) {
				port.postMessage(configChangedAction)
			}
		}
	)

	chrome.runtime.onConnectExternal.addListener(port => {
		const { tab } = port.sender
		const { windowId, id } = tab
		port.name = `window ${windowId}, tab ${id}`
		log(`background: port connected: ${port.name}`)

		allPorts.add(port)

		port.onMessage.addListener(pageMessageHandler)

		port.onDisconnect.addListener(
			(disconnectedPort: chrome.runtime.Port) => {
				const portName = disconnectedPort.name || '<unnamed port>'
				log('port disconnected: %j', portName)

				allPorts.delete(port)

				for (const [roomID, subRecord] of stompSubsByRoom.entries()) {
					if (subRecord.ports.includes(port)) {
						subRecord.ports = subRecord.ports.filter(
							p => p !== port
						)
						if (subRecord.ports.length === 0) {
							log(
								'last port gone for subscription to %j, unsubscribing',
								roomID
							)
							subRecord.subscription.unsubscribe()
							stompSubsByRoom.delete(roomID)
						}
					}
				}
			}
		)
	})
}

function stompFrameHandler(frame: IMessage) {
	const message = JSON.parse(frame.body)
	log('server->background', message.type, message.payload)

	const { roomID } = message.payload
	const subRecord = stompSubsByRoom.get(roomID)
	if (subRecord) {
		for (const port of subRecord.ports) {
			port.postMessage(message)
		}
	}
}

async function pageMessageHandler(
	action: MessagesFromPage,
	port: chrome.runtime.Port
) {
	if (subscribeToRoom.match(action)) {
		const roomID = action.payload

		const portName = port.name || '<unnamed port>'

		log('subscription request to %j for %j', roomID, portName)

		const oldSub = stompSubsByRoom.get(roomID)
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
			stompSubsByRoom.set(roomID, {
				subscription,
				roomID,
				ports: [port],
			})
			log('created new subscription to %j for %j', roomID, portName)
		}
	} else if (unsubscribeFromRoom.match(action)) {
		const roomID = action.payload

		const sub = stompSubsByRoom.get(roomID)

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
			stompSubsByRoom.delete(roomID)
		}
	} else if (syncStateWithPeers.match(action)) {
		const { roomID } = action.payload

		const destination = `/room/${roomID}`

		log(`page->background->${destination}`, action)

		const body = JSON.stringify(action)
		stompClient.publish({
			destination,
			body,
		})
	} else if (changeConfig.match(action)) {
		chrome.storage.sync.set(action.payload)
	} else if (requestFromBackground.match(action)) {
		const config = await asyncChromeStorageSyncGet(null)
		port.postMessage(configLoaded(config))
	} else {
		assertUnreachable(action)
	}
}
