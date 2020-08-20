import { Client as StompClient, IMessage, StompSubscription } from '@stomp/stompjs'
import { MessagesFromPage } from './types/extensionMessages'
import { assertUnreachable } from './util/assertUnreachable'
import { asyncChromeStorageSyncGet } from './util/asyncChromeStorageSyncGet'

const stompClient = new StompClient({
	brokerURL: 'wss://ytsync.de.n3t.work/ws',
})

type RoomSubscriptionRecord = {
	subscription: StompSubscription
	roomID: String
}

const stompSubs = new Map<chrome.runtime.Port, RoomSubscriptionRecord>()

async function pageMessageHandler(event: MessagesFromPage, port: chrome.runtime.Port) {
	switch (event.type) {
		case 'subscribe':
			// event = event as SubscribeEvent
			trace: `subscribing to ${event.roomID} for ${port.name || '<unnamed port>'}`

			const oldSub = stompSubs.get(port)
			if (oldSub) {
				oldSub.subscription.unsubscribe()
				stompSubs.set(port, null)
			}

			const roomSub = stompClient.subscribe(`/room/${event.roomID}`, stompFrameHandler)
			stompSubs.set(port, { subscription: roomSub, roomID: event.roomID })
			return

		case 'unsubscribe':
			const sub = stompSubs.get(port)
			trace: `unsubscribing from ${sub.roomID} for ${port.name || '<unnamed port>'}`

			sub.subscription.unsubscribe()
			stompSubs.set(port, null)
			return

		case 'sync':
			const destination = `/room/${event.playbackState.roomID}`

			console.debug(`page->background->${destination}`, event)

			const body = JSON.stringify(event)
			stompClient.publish({
				destination,
				body,
			})
			return

		case 'config.set':
			chrome.storage.sync.set(event.items)
			return

		case 'config.get':
			const items = await asyncChromeStorageSyncGet(event.fields)
			port.postMessage({
				type: 'config.get.response',
				items,
			})
			return

		default:
			assertUnreachable(event)
	}
}

chrome.runtime.onConnectExternal.addListener(port => {
	trace: 'background: port connected'

	port.onMessage.addListener(pageMessageHandler)

	port.onDisconnect.addListener((disconnectedPort: chrome.runtime.Port) => {
		trace: `port disconnected: ${disconnectedPort.name || '<unnamed port>'}`

		// unsubscribe from room and forget port
		const roomSub = stompSubs.get(port)
		roomSub.subscription.unsubscribe()
		stompSubs.delete(port)
	})

	// add to ports list
	stompSubs.set(port, null)
})

function stompFrameHandler(frame: IMessage) {
	const message = JSON.parse(frame.body)
	console.debug('server->background', { message, frame })

	for (const [port, sub] of stompSubs.entries()) {
		if (sub?.roomID === message.roomID) {
			port.postMessage(message)
		}
	}
}

stompClient.activate()
