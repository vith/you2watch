import { SyncState, SessionID } from '../../types/SyncState'
import { getCurrentPlayerState } from '../../util/moviePlayer/getCurrentPlayerState'
import { AppThunk } from '../../state/store'
import { PlaybackVerb } from '../../types/PlaybackVerb'
import { receiveSyncState, loadingVideo, updateGoal } from './sync'
import { GlobalStateContainer } from '../../state/notSafeForRedux'

export const handleSyncEvent = (receivedSync: SyncState): AppThunk =>
	async (dispatch, getState) => {
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


		// if (remotePlayerState.playbackVerb !== PlaybackVerb.BUFFERING) {
		dispatch(receiveSyncState(receivedSync))
		// this.setState({
		// 	syncedStates: [...this.state.syncedStates, receivedState],
		// })
		// }

		trace: `RECEIVED ${new Date(receivedSync.peerTimestamp).toLocaleTimeString()} ${receivedSync.playerState.playbackVerb} ${receivedSync.playerState.mediaOffset}`

		if (remotePlayerState.videoID !== playbackState.videoID) {
			// @ts-expect-error
			trace: 'FOLLOWING remote video change', receivedSync

			dispatch(loadingVideo(remotePlayerState.videoID))
			// this.setState({ loadingVideoID: receivedState.videoID })

			// cause youtube app to navigate to new video without full page load
			// @ts-expect-error
			document.querySelector('ytd-watch-flexy').fire('yt-navigate', {
				endpoint: { watchEndpoint: { videoId: remotePlayerState.videoID } },
			})

			return
		}

		const { moviePlayer } = GlobalStateContainer.getState(localSessionID)

		if (!receivedSync.shouldFollow) {
			trace: `IGNORING RECEIVED ${remotePlayerState.playbackVerb} because shouldFollow was ${receivedSync.shouldFollow}`
			return
		} else {
			// @ts-expect-error
			trace: 'UPDATING GOAL TO FOLLOW', remotePlayerState
			dispatch(updateGoal(receivedSync))
		}

		switch (remotePlayerState.playbackVerb) {
			case PlaybackVerb.PLAYING:
				trace: `<-sync playing at ${remotePlayerState.mediaOffset}`
				moviePlayer.seekTo(remotePlayerState.mediaOffset, true)
				moviePlayer.playVideo()
				return

			case PlaybackVerb.PAUSED:
				trace: `<-sync pausing at ${remotePlayerState.mediaOffset} due to remote ${remotePlayerState.playbackVerb}`
				moviePlayer.pauseVideo()
				moviePlayer.seekTo(remotePlayerState.mediaOffset, true)
				return

			case PlaybackVerb.BUFFERING:
				// @ts-expect-error
				trace: 'remote is buffering', receivedSync
				return

			case PlaybackVerb.UNSTARTED:
				trace: `remote video is UNSTARTED ${remotePlayerState.videoID}`

				if (playbackState.videoID !== remotePlayerState.videoID) {
					trace: `SYNC loading new video ${remotePlayerState.videoID}`

					moviePlayer.loadVideoById(remotePlayerState.videoID)
				}
				return
		}

		console.error(`no handler for received playerState: ${remotePlayerState.playbackVerb}`)
	}
