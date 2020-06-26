import { debugEvent } from './util/debugging'
import { hookMethod } from './util/hook'
import cryptoRandomString from 'crypto-random-string'

function querySelectorOne(baseElm, query) {
	const matches = baseElm.querySelectorAll(query)
	if (matches.length !== 1) {
		throw new Exception('Expected exactly one matching node for selector')
	}
	return matches[0]
}

const moviePlayer = querySelectorOne(document, '#movie_player')
const videoElm = querySelectorOne(moviePlayer, 'video')

const roomID = 'myRoom'
const userID = cryptoRandomString({ length: 10, type: 'url-safe' })

const port = chrome.runtime.connect('mmfgacfcjdhhobbicplipgeablenfego')

port.onDisconnect.addListener(thisPort => {
	const reason = chrome.runtime.lastError.message
	console.debug('port disconnected', reason)
})

function receiveSeek(event) {
	if (event.userID === userID) return

	console.debug(`seeking to ${event.mediaOffset} to follow ${event.userID}`)
	moviePlayer.seekTo(event.mediaOffset)
}

port.onMessage.addListener(msg => {
	console.debug('background->page', msg)

	switch (msg.eventName) {
		case 'seeking':
			receiveSeek(msg)
			break
		default:
			throw new Error(`Unhandled event type: ${msg.eventName}`)
	}
})

videoElm.addEventListener('seeking', seekingEvent => {
	const mediaOffset = moviePlayer.getCurrentTime()

	const seekingMessage = {
		eventName: 'seeking',
		mediaOffset,
		roomID,
		userID,
	}

	port.postMessage(seekingMessage)
})

debugEvent('seeking', videoElm, ({ emitter }) => {
	const currentTime = emitter.getCurrentTime()
	return { currentTime }
})

debugEvent('seeked', videoElm)

hookMethod(moviePlayer, 'seekTo', (object, origFn, ...args) => {
	console.log('hooked seekTo called', ...args)
	return origFn.call(object, ...args)
})
