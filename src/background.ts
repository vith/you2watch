import { Client as StompClient, StompSubscription, IMessage } from '@stomp/stompjs'

const stompClient = new StompClient({
	// brokerURL: 'wss://vith.n3t.work:444/ytsync',
	// brokerURL: 'ws://192.168.1.3:12874/ws',
	brokerURL: 'wss://ytsync.de.n3t.work/ws',
})

type RoomSubscriptionRecord = {
	subscription: StompSubscription
	roomID: String
}

const stompSubs = new Map<chrome.runtime.Port, RoomSubscriptionRecord>()

const pageMessageHandler = (msg, port: chrome.runtime.Port) => {
	const destination = `/room/${msg.roomID || msg.playbackState?.roomID}`

	console.debug(`page->background->${destination}`, msg)

	switch (msg.eventName) {
		case 'subscribe':
			trace: `subscribing to ${msg.roomID} for`, port

			const oldSub = stompSubs.get(port)
			if (oldSub) {
				oldSub.subscription.unsubscribe()
				stompSubs.set(port, null)
			}

			const roomSub = stompClient.subscribe(`/room/${msg.roomID}`, stompFrameHandler)
			stompSubs.set(port, { subscription: roomSub, roomID: msg.roomID })
			break

		case 'unsubscribe':
			const sub = stompSubs.get(port)
			trace: `unsubscribing from ${sub.roomID} for`, port

			sub.subscription.unsubscribe()
			stompSubs.set(port, null)
			break

		case 'sync':
			const body = JSON.stringify(msg)
			stompClient.publish({
				destination,
				body,
			})
			break

		default:
			throw new Error(`Unhandled page message type: ${msg.eventName}`)
	}
}

chrome.runtime.onConnectExternal.addListener(port => {
	trace: 'background: port connected'

	port.onMessage.addListener(pageMessageHandler)

	port.onDisconnect.addListener(disconnectedPort => {
		// remove from ports list when disconnected
		// ports = ports.filter(port => port !== disconnectedPort)
		const roomSub = stompSubs.get(port)
		roomSub.subscription.unsubscribe()
		stompSubs.delete(port)
	})

	// add to ports list
	stompSubs.set(port, null)
})

function stompFrameHandler(frame: IMessage) {
	const message = JSON.parse(frame.body)
	trace: 'server->background', { message, frame: frame }

	for (const [port, sub] of stompSubs.entries()) {
		if (sub?.roomID === message.roomID) {
			port.postMessage(message)
		}
	}
}

// stompClient.onConnect = connectFrame => {
// 	const roomSub = stompClient.subscribe('/room/myRoom', stompFrameHandler)
// }

stompClient.activate()
