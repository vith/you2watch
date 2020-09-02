import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { connectToBackgroundScript } from '../features/connectToBackgroundScript'
import { playbackVerbChanged } from '../features/sync/thunks/playbackVerbChanged'
import { seeking } from '../features/sync/thunks/seeking'
import { loadConfigFromBackground } from '../state/config'
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
	const [loading, setLoading] = useState(true)
	const [port, setPort] = useState<chrome.runtime.Port>(null)

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
		const createdPort = connectToBackgroundScript(dispatch, sessionID)
		GlobalStateContainer.setState(sessionID, { port: createdPort })
		setPort(createdPort)
		dispatch(portConnected(sessionID))
	}

	function loadConfigOnMountEffect() {
		async function loadConfig() {
			const configResponse = await dispatch(loadConfigFromBackground())
			const config = configResponse.payload
			console.log('loaded config', config)
			setLoading(false)
		}
		loadConfig()
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
	useEffect(loadConfigOnMountEffect, [])
	useEffect(watchPlayerOnMountEffect, [])



	if (loading) {
		return 'loading'
	} else {
		return <YouTubeHeaderButton />
	}
}
