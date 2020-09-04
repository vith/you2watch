import { playbackVerbChanged } from './features/sync/thunks/playbackVerbChanged'
import { seeking } from './features/sync/thunks/seeking'
import { loadConfigFromBackground } from './state/config'
import { findMoviePlayer, findVideoElement } from './state/domNodes'
import { connectToBackgroundScript } from './state/port'
import { store } from './state/store'
import {
	NumericPlaybackVerb,
	PlaybackVerb,
	toPlaybackVerb,
} from './types/PlaybackVerb'
import { SessionID } from './types/SyncState'
import { YouTubeMoviePlayer } from './types/YouTubeMoviePlayer'
import { baseLog } from './util/logging'

const log = baseLog.extend('you2watchApp')

const { dispatch, getState } = store

export class PageService {
	sessionID: SessionID = getState().sync.sessionID
	port: chrome.runtime.Port
	moviePlayer: YouTubeMoviePlayer
	videoElement: HTMLVideoElement

	async initialize() {
		await this.connectBackgroundPort()
		await this.loadConfig()
		await this.watchMoviePlayer()
		await this.watchVideoElement()
	}

	async connectBackgroundPort() {
		this.port = connectToBackgroundScript(dispatch, getState)
	}

	async loadConfig() {
		const configResponse = await dispatch(loadConfigFromBackground())
		const config = configResponse.payload
		log('loaded config', config)
	}

	async watchMoviePlayer() {
		const { onStateChange } = this

		const moviePlayer = await findMoviePlayer(document, store)

		// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
		moviePlayer.addEventListener('onStateChange', onStateChange)

		this.moviePlayer = moviePlayer
	}

	async watchVideoElement() {
		const { moviePlayer, onSeeking } = this

		const videoElement = await findVideoElement(moviePlayer, store)

		videoElement.addEventListener('seeking', onSeeking)

		this.videoElement = videoElement
	}
	onStateChange(newPlaybackVerbCode: NumericPlaybackVerb) {
		const newPlaybackVerb: PlaybackVerb = toPlaybackVerb(
			newPlaybackVerbCode
		)
		dispatch(playbackVerbChanged(newPlaybackVerb))
	}

	onSeeking(seekingEvent: Event) {
		dispatch(seeking(seekingEvent))
	}

	destroy() {
		// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
		this.moviePlayer.removeEventListener(
			'onStateChange',
			this.onStateChange
		)
		this.videoElement.removeEventListener('seeking', this.onSeeking)
	}
}
