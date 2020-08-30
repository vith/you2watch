// import { waitForElement } from '../util/dom/waitForElement'
// import { querySelectorOne } from '../util/dom/querySelectorOne'
// import { PlaybackVerb, toPlaybackVerb, NumericPlaybackVerb } from '../types/PlaybackVerb'
// import { isStateChangeInitiatedByUser, isSeekInitiatedByUser } from './userIntentionDetectors'
// import { store } from '../state/store'
// import { syncSlice, loadingVideo, playbackStateChanged } from '../state/player'
// import { foundMoviePlayer, foundVideoElement } from '../state/domNodes'
// import { YouTubeMoviePlayer } from '../types/YouTubeMoviePlayer'

// export async function watchPlayer() {
// 	const moviePlayerPromise = waitForElement(document, '#movie_player')

// 	const moviePlayer = (await moviePlayerPromise) as YouTubeMoviePlayer

// 	// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
// 	moviePlayer.addEventListener('onStateChange', onStateChange)

// 	store.dispatch(foundMoviePlayer(sessionID))

// 	const videoElm = querySelectorOne(this.moviePlayer, 'video') as HTMLVideoElement
// 	videoElm.addEventListener('seeking', onSeeking)

// 	// store.dispatch(foundVideoElement(videoElm))
// }

// function onStateChange(newPlayerActionCode: NumericPlaybackVerb) {
// 	const newState: PlaybackVerb = toPlaybackVerb(newPlayerActionCode)
// 	store.dispatch(playbackStateChanged({ newState }))
// }

/* function onStateChange(newStateCode: NumericPlayerState) {
	// collect and prepare inputs
	const newState: PlayerState = toPlayerState(newStateCode)
	const { playbackState, lastSyncedState } = this
	const previousState = this.state.localPlayerState

	// handle special case: waiting for navigation to new video
	const { loadingVideoID } = this.state
	if (loadingVideoID) {
		if (playbackState.videoID !== loadingVideoID) {
			// ignore events for old video ID
			return
		}

		// this.setState({ loadingVideoID: null })
		store.dispatch(loadingVideo({ videoID: loadingVideoID }))
	}

	if (newState !== PlayerState.BUFFERING) {
		this.setState({ localPlayerState: newState })
	}

	console.debug(`onStateChange ${previousState} -> ${newState}`, playbackState)

	const { byUser, decidedBy, reason } = isStateChangeInitiatedByUser(
		newState,
		lastSyncedState,
		playbackState
	)

	if (!byUser) {
		console.debug('IGNORE', 'onStateChange', newState, 'due to:', reason, `(${decidedBy})`)
		return
	}

	this.maybeShareState(playbackState)
} */

// function onSeeking(seekingEvent: Event) {
// 	const { playbackState, lastSyncedState } = this

// 	console.debug('onSeeking', seekingEvent, playbackState)

// 	const { byUser, decidedBy, reason } = isSeekInitiatedByUser(
// 		seekingEvent,
// 		lastSyncedState,
// 		playbackState
// 	)

// 	if (!byUser) {
// 		trace: `IGNORE seeking ${seekingEvent} due to: ${reason} (${decidedBy})`
// 		return
// 	}

// 	this.maybeShareState(playbackState)
// }
