import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectToBackgroundScript } from '../features/connectToBackgroundScript'
import { playbackVerbChanged } from '../features/sync/thunks/playbackVerbChanged'
import { seeking } from '../features/sync/thunks/seeking'
import { foundMoviePlayer, foundVideoElement } from '../state/domNodes'
import { GlobalStateContainer } from '../state/notSafeForRedux'
import { portConnected } from '../state/port'
import { RootState } from '../state/rootReducer'
import { NumericPlaybackVerb, PlaybackVerb, toPlaybackVerb } from '../types/PlaybackVerb'
import { YouTubeMoviePlayer } from '../types/YouTubeMoviePlayer'
import { querySelectorOne } from '../util/dom/querySelectorOne'
import { waitForElement } from '../util/dom/waitForElement'
import { YouTubeHeaderButton } from './YouTubeHeaderButton'

export const YouTooApp = () => {
	const dispatch = useDispatch()
	const sessionID = useSelector((state: RootState) => state.sync.sessionID)



	/* HANDLERS */

	function onStateChange(newPlaybackVerbCode: NumericPlaybackVerb) {
		const newPlaybackVerb: PlaybackVerb = toPlaybackVerb(newPlaybackVerbCode)
		dispatch(playbackVerbChanged(newPlaybackVerb))
	}

	function onSeeking(seekingEvent: Event) {
		dispatch(seeking(seekingEvent))
	}



	/* EFFECTS */

	function connectToBackgroundPortOnMountEffect() {
		const port = connectToBackgroundScript(dispatch, sessionID)
		GlobalStateContainer.setState(sessionID, { port })
		dispatch(portConnected(sessionID))
	}

	function watchPlayerOnMountEffect() {
		let moviePlayer: YouTubeMoviePlayer
		let videoElement: HTMLVideoElement

		async function watchMoviePlayer() {
			moviePlayer = (await waitForElement(document, '#movie_player')) as YouTubeMoviePlayer

			// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
			moviePlayer.addEventListener('onStateChange', onStateChange)

			GlobalStateContainer.setState(sessionID, { moviePlayer })
			dispatch(foundMoviePlayer(sessionID))

			watchVideoElement()
		}

		async function watchVideoElement() {
			videoElement = querySelectorOne(moviePlayer, 'video') as HTMLVideoElement
			videoElement.addEventListener('seeking', onSeeking)

			GlobalStateContainer.setState(sessionID, { videoElement })
			dispatch(foundVideoElement(sessionID))
		}

		watchMoviePlayer()

		return function cleanup() {
			// @ts-expect-error: @types/youtube is wrong, at least for the official non-embed player
			moviePlayer.removeEventListener('onStateChange', onStateChange)

			videoElement.removeEventListener('seeking', onSeeking)
		}
	}



	useEffect(connectToBackgroundPortOnMountEffect, [])
	useEffect(watchPlayerOnMountEffect, [])



	return <YouTubeHeaderButton />
}
