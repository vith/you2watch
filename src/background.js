import { Client as StompClient } from '@stomp/stompjs'
import { extractVideoID } from './util/extractVideoID'

const stompClient = new StompClient({
	brokerURL: 'ws://localhost:8080/ws',
})

const pageMessageHandler = (message, port) => {
	const videoID = extractVideoID(port.sender.url)

	console.debug('page->background', {
		message,
		port,
		videoID,
	})

	const timestamp = Date.now()

	const seekingMessage = {
		...message,
		videoID,
		timestamp,
	}

	console.debug('background->server', seekingMessage)

	stompClient.publish({
		destination: `/room/${seekingMessage.roomID}/seek`,
		body: JSON.stringify(seekingMessage),
	})
}

const pagePorts = []

chrome.runtime.onConnectExternal.addListener(port => {
	console.debug('background: port connected')
	port.onMessage.addListener(pageMessageHandler)
	pagePorts.push(port)
})

function stompFrameHandler(frame) {
	const message = JSON.parse(frame.body)
	console.debug('server->background', { message, frame })

	// TODO: filter ports
	for (const p of pagePorts) {
		p.postMessage(message)
	}
}

stompClient.onConnect = connectFrame => {
	const roomSub = stompClient.subscribe('/room/myRoom', stompFrameHandler)
}

stompClient.activate()
