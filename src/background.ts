import { Client as StompClient, StompSubscription } from '@stomp/stompjs'
import { extractVideoID } from './util/extractVideoID'

const stompClient = new StompClient({
	// brokerURL: 'wss://vith.n3t.work:444/ytsync',
	// brokerURL: 'ws://192.168.1.3:12874/ws',
	brokerURL: 'wss://ytsync.de.n3t.work/ws',
})

const pageMessageHandler = msg => {
	const destination = `/room/${msg.roomID}`

	trace: `page->background->${destination}`, msg

	const body = JSON.stringify(msg)

	stompClient.publish({
		destination,
		body,
	})

	/* switch (msg.eventName) {
		case 'seeking':
			handleSeekingMessage(msg)
			break
		case 'videoChange':
			handleVideoChange(msg)
			break
		default:
			throw new Error(`Unhandled page message type: ${msg.eventName}`)
	} */
}

const handleSeekingMessage = seekingMessage => {
	// const videoID = extractVideoID(port.sender.url)

	trace: 'background->server', seekingMessage

	stompClient.publish({
		destination: `/room/${seekingMessage.roomID}/seek`,
		body: JSON.stringify(seekingMessage),
	})
}

const handleVideoChange = videoChangeMessage => {
	trace: 'background->server', videoChangeMessage

	stompClient.publish({
		destination: `/room/${videoChangeMessage.roomID}/videoChange`,
		body: JSON.stringify(videoChangeMessage),
	})
}

let ports = []

chrome.runtime.onConnectExternal.addListener(port => {
	trace: 'background: port connected'

	port.onMessage.addListener(pageMessageHandler)

	port.onDisconnect.addListener(disconnectedPort => {
		// remove from ports list when disconnected
		ports = ports.filter(port => port !== disconnectedPort)
	})

	// add to ports list
	ports = [...ports, port]
})

function stompFrameHandler(frame) {
	const message = JSON.parse(frame.body)
	trace: 'server->background', { message, frame }

	// TODO: filter ports by roomID
	for (const port of ports) {
		port.postMessage(message)
	}
}

const roomSubs = new Map<String, StompSubscription>()

stompClient.onConnect = connectFrame => {
	const roomSub = stompClient.subscribe('/room/myRoom', stompFrameHandler)
}

stompClient.activate()
