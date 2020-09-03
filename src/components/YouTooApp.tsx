import { playbackVerbChanged } from '../features/sync/thunks/playbackVerbChanged'
import { seeking } from '../features/sync/thunks/seeking'
import { loadConfigFromBackground } from '../state/config'
import { foundMoviePlayer, foundVideoElement } from '../state/domNodes'
import { connectToBackgroundScript } from '../state/port'
import { store } from '../state/store'
import { NumericPlaybackVerb, PlaybackVerb, toPlaybackVerb } from '../types/PlaybackVerb'
import { SessionID } from '../types/SyncState'
import { YouTubeMoviePlayer } from '../types/YouTubeMoviePlayer'
import { querySelectorOne } from '../util/dom/querySelectorOne'
import { waitForElement } from '../util/dom/waitForElement'
import { YouTooLogger } from '../util/YouTooLogger'

const log = YouTooLogger.extend('YouTooApp')

export class YouTooApp {
	sessionID: SessionID = store.getState().sync.sessionID
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
		const result = await store.dispatch(connectToBackgroundScript())
		this.port = result.payload
	}

	async loadConfig() {
		const configResponse = await store.dispatch(loadConfigFromBackground())
		const config = configResponse.payload
		log('loaded config', config)
	}

	async watchMoviePlayer() {
		const { sessionID, onStateChange } = this
		const moviePlayer = (await waitForElement(document, '#movie_player')) as YouTubeMoviePlayer

		// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
		moviePlayer.addEventListener('onStateChange', onStateChange)

		store.dispatch(foundMoviePlayer({ sessionID, moviePlayer }))

		this.moviePlayer = moviePlayer
	}

	onStateChange(newPlaybackVerbCode: NumericPlaybackVerb) {
		const newPlaybackVerb: PlaybackVerb = toPlaybackVerb(newPlaybackVerbCode)
		store.dispatch(playbackVerbChanged(newPlaybackVerb))
	}

	async watchVideoElement() {
		const { moviePlayer, onSeeking, sessionID } = this
		const videoElement = querySelectorOne(moviePlayer, 'video') as HTMLVideoElement
		videoElement.addEventListener('seeking', onSeeking)

		store.dispatch(foundVideoElement({ sessionID, videoElement }))

		this.videoElement = videoElement
	}

	onSeeking(seekingEvent: Event) {
		store.dispatch(seeking(seekingEvent))
	}

	destroy() {
		// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
		this.moviePlayer.removeEventListener('onStateChange', this.onStateChange)
		this.videoElement.removeEventListener('seeking', this.onSeeking)
	}
}
