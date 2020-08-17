import { debugEvent } from './util/debugging'
import { hookMethod } from './util/hook'
import cryptoRandomString from 'crypto-random-string'
import React from 'react'
import ReactDOM from 'react-dom'

function querySelectorOne(baseElm, query) {
	const matches = baseElm.querySelectorAll(query)
	if (matches.length !== 1) {
		throw new Exception('Expected exactly one matching node for selector')
	}
	return matches[0]
}

const moviePlayer = querySelectorOne(document, '#movie_player')
const videoElm = querySelectorOne(moviePlayer, 'video')

const myRoomID = 'myRoom'
const myUserID = cryptoRandomString({ length: 10, type: 'url-safe' })

const port = chrome.runtime.connect('mmfgacfcjdhhobbicplipgeablenfego')

port.onDisconnect.addListener(thisPort => {
	const reason = chrome.runtime.lastError.message
	console.debug('port disconnected', reason)
})

const handlers = {
	seeking(event) {
		console.debug(`seeking to ${event.mediaOffset} to follow ${event.userID}`)

		moviePlayer.seekTo(event.mediaOffset)
	},

	pause(event) {
		console.debug(`pausing to follow ${event.userID}`)

		moviePlayer.pauseVideo()
	},

	play(event) {
		console.debug(`playing to follow ${event.userID}`)

		moviePlayer.playVideo()
	},
}

function backgroundMessageReceiver(event) {
	console.debug('page<-background', event)

	const { userID, eventName } = event

	if (userID === myUserID) return

	if (!Object.keys(handlers).includes(eventName)) {
		throw new Error(`No handler for ${eventName} event`)
	}

	const handler = handlers[eventName]

	handler(event)

	lastSyncedState = event
}

port.onMessage.addListener(backgroundMessageReceiver)

function getCurrentState() {
	return {
		roomID: myRoomID,
		userID: myUserID,
		videoID: moviePlayer.getVideoData().video_id,
		mediaOffset: moviePlayer.getCurrentTime(),
		playerState: moviePlayer.getPlayerState(),
		timestamp: Date.now(),
	}
}

let lastSyncedState

function nearlyEqual(x, y, margin = 1000) {
	return Math.abs(x - y) <= margin
}

function isEventTriggeredBySync(eventName, eventArg, currentState) {
	if (!lastSyncedState) return false

	const sameMediaOffset = nearlyEqual(
		currentState.mediaOffset,
		lastSyncedState.mediaOffset,
		1 /* seconds */
	)

	const samePlayerState = currentState.playerState === lastSyncedState.playerState

	const sameVideoID = currentState.videoID === lastSyncedState.videoID

	/* const sameClockTime = nearlyEqual(
		currentState.timestamp,
		lastSyncedState.timestamp,
		10000
	) */

	const triggeredBySync = sameMediaOffset && samePlayerState && sameVideoID /* && sameClockTime */

	console.debug({
		triggeredBySync,
		conditions: {
			sameMediaOffset,
			samePlayerState,
			sameVideoID,
			// sameClockTime,
		},
	})

	return triggeredBySync
}

videoElm.addEventListener('seeking', seekingEvent => {
	const currentState = getCurrentState()

	if (isEventTriggeredBySync('seeking', seekingEvent, currentState)) {
		return console.debug('ignoring seek event caused by sync')
	}

	sendEvent('seeking', currentState)
})

const PlayerState = {
	UNSTARTED: -1,
	ENDED: 0,
	PLAYING: 1,
	PAUSED: 2,
	BUFFERING: 3,
	CUED: 4,
	getName(stateCode) {
		return Object.entries(PlayerState).find(([name, code]) => code === stateCode)[0]
	},
}

moviePlayer.addEventListener('onStateChange', newPlayerState => {
	const currentState = getCurrentState()

	console.debug('onStateChange', currentState)

	if (isEventTriggeredBySync('onStateChange', newPlayerState, currentState)) {
		return console.debug('ignoring onStateChange event caused by sync')
	}

	shareState(currentState)
})

function shareState(state) {
	console.debug('sharing state', state)
	port.postMessage(state)
	lastSyncedState = state
}

hookMethod(moviePlayer, 'seekTo', (object, origFn, ...args) => {
	console.log('hooked seekTo called', ...args)
	return origFn.call(object, ...args)
})

class SyncUI extends React.Component {
	render() {
		return <div>Hello World</div>
	}

	componentWillMount() {
		this.moviePlayer = querySelectorOne(document, '#moviePlayer')
		this.videoElm = querySelectorOne(this.moviePlayer, 'video')
	}
}

const syncUiMountPoint = document.createElement('div')
syncUiMountPoint.id = 'sync-ui'

// search for #info under #primary-inner because youtube frontend has 5 different #info elements...
const infoElm = primaryInner.querySelector('#primary-inner > #info')
document.querySelector('#primary-inner').insertBefore(syncUiMountPoint, infoElm)

ReactDOM.render(<SyncUI />, syncUiMountPoint)

console.log('sync runtime loaded')
