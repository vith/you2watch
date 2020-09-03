import { GlobalStateContainer } from '../../../state/notSafeForRedux'
import { AppThunk } from '../../../state/store'
import { PlaybackVerb } from '../../../types/PlaybackVerb'
import { SyncState } from '../../../types/SyncState'
import { getCurrentPlayerState } from '../../../util/moviePlayer/getCurrentPlayerState'
import { YouTooLogger } from '../../../util/YouTooLogger'
import { loadingVideo, receiveSyncState, updateGoal } from '../sync'

const log = YouTooLogger.extend(handleSyncEvent.name)

export function handleSyncEvent(receivedSync: SyncState): AppThunk {
	return async function handleSyncEventExecutor(dispatch, getState) {
		const state = getState()
		const localSessionID = state.sync.sessionID
		const { roomID } = state.config
		const remotePlayerState = receivedSync.playerState
		const playbackState = getCurrentPlayerState(localSessionID)

		// only react to state shared by others
		if (receivedSync.sessionID === localSessionID) {
			return
		}

		// only react to events for our room
		if (receivedSync.roomID !== roomID) {
			return
		}

		// store received state in map by peer sessionID
		dispatch(receiveSyncState(receivedSync))

		if (!receivedSync.shouldFollow) {
			log(
				'IGNORING RECEIVED %j because shouldFollow was %j',
				remotePlayerState.playbackVerb,
				receivedSync.shouldFollow
			)
			return
		}

		log(
			'RECEIVED state %j %j at %s',
			receivedSync.playerState.mediaOffset,
			receivedSync.playerState.playbackVerb,
			new Date(receivedSync.peerTimestamp).toLocaleTimeString()
		)

		if (remotePlayerState.videoID !== playbackState.videoID) {
			log('FOLLOWING remote video change', receivedSync)

			dispatch(loadingVideo(remotePlayerState.videoID))

			// cause youtube app to navigate to new video without full page load
			// @ts-expect-error
			document.querySelector('ytd-watch-flexy').fire('yt-navigate', {
				endpoint: {
					watchEndpoint: { videoId: remotePlayerState.videoID },
				},
			})

			return
		}

		log('UPDATING GOAL TO FOLLOW', remotePlayerState)
		dispatch(updateGoal(receivedSync))

		const { moviePlayer } = GlobalStateContainer.getState(localSessionID)

		switch (remotePlayerState.playbackVerb) {
			case PlaybackVerb.PLAYING:
				log('<-sync playing at', remotePlayerState.mediaOffset)
				moviePlayer.seekTo(remotePlayerState.mediaOffset, true)
				moviePlayer.playVideo()
				return

			case PlaybackVerb.PAUSED:
				log(
					'<-sync pausing at',
					remotePlayerState.mediaOffset,
					'due to remote',
					remotePlayerState.playbackVerb
				)
				moviePlayer.pauseVideo()
				moviePlayer.seekTo(remotePlayerState.mediaOffset, true)
				return

			case PlaybackVerb.BUFFERING:
				log('remote is buffering', receivedSync)
				moviePlayer.seekTo(remotePlayerState.mediaOffset, true)
				return

			case PlaybackVerb.UNSTARTED:
				log('remote video is UNSTARTED', remotePlayerState.videoID)

				if (playbackState.videoID !== remotePlayerState.videoID) {
					log('SYNC loading new video', remotePlayerState.videoID)

					moviePlayer.loadVideoById(remotePlayerState.videoID)
				}
				return

			case PlaybackVerb.ENDED:
				log('remote video ENDED', remotePlayerState.videoID)
				moviePlayer.seekTo(Infinity, true)
				return
		}

		throw new Error(
			`no handler for received playerState: ${remotePlayerState.playbackVerb}`
		)
	}
}
