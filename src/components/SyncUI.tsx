import cryptoRandomString from 'crypto-random-string'
import React from 'react'
import {
	CheckboxProps,
	Form,
	FormCheckbox,
	FormGroup,
	FormInput,
	Grid,
	GridColumn,
	InputOnChangeData,
	Segment,
} from 'semantic-ui-react'
import { pageScriptID } from '../contentScript'
import { ConfigGetResponse, MessagesFromBackground, SyncEvent } from '../types/extensionMessages'
import { NumericPlayerState, PlayerState, toPlayerState } from '../types/PlayerState'
import { SyncState } from '../types/SyncState'
import { querySelectorOne } from '../util/querySelectorOne'
import { isSeekInitiatedByUser, isStateChangeInitiatedByUser } from '../util/userIntentionDetectors'
import { PlaybackState } from './PlaybackState'

interface SyncUIState {
	loading: boolean
	userID: string
	roomID: string
	sessionID: string
	localPlayerState: PlayerState
	syncedStates: SyncState[]
	syncEnabled: boolean
	loadingVideoID: string
}

export class SyncUI extends React.Component<{}, SyncUIState> {
	moviePlayer: YT.Player & Element
	videoElm: HTMLVideoElement
	port: chrome.runtime.Port

	constructor(props: {}) {
		super(props)

		this.state = {
			loading: true,
			roomID: null,
			userID: null,
			sessionID: cryptoRandomString({ length: 12, type: 'url-safe' }),
			syncedStates: [],
			localPlayerState: null,
			syncEnabled: false,
			loadingVideoID: null,
		}
		this.onSeeking = this.onSeeking.bind(this)
		this.onStateChange = this.onStateChange.bind(this)
		this.onMessage = this.onMessage.bind(this)
		this.onPortDisconnect = this.onPortDisconnect.bind(this)
	}

	componentDidMount() {
		this.setupBackgroundPort()
		this.setupPlayerHandlers()
		this.loadConfig()
	}

	loadConfig() {
		this.port.postMessage({
			type: 'config.get',
		})
	}

	setupPlayerHandlers() {
		this.moviePlayer = querySelectorOne(document, '#movie_player') as YT.Player & Element
		// @ts-expect-error: the external typings are wrong
		this.moviePlayer.addEventListener('onStateChange', this.onStateChange)

		this.videoElm = querySelectorOne(this.moviePlayer, 'video') as HTMLVideoElement
		this.videoElm.addEventListener('seeking', this.onSeeking)
	}

	onSeeking(seekingEvent: Event) {
		const { playbackState, lastSyncedState } = this

		console.debug('onSeeking', seekingEvent, playbackState)

		const { byUser, decidedBy, reason } = isSeekInitiatedByUser(
			seekingEvent,
			lastSyncedState,
			playbackState
		)

		if (!byUser) {
			trace: `IGNORE seeking ${seekingEvent} due to: ${reason} (${decidedBy})`
			return
		}

		this.maybeShareState(playbackState)
	}

	onStateChange(newStateCode: NumericPlayerState) {
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

			this.setState({ loadingVideoID: null })
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
	}

	maybeShareState(playbackState: SyncState = this.playbackState) {
		if (this.state.syncEnabled) {
			this.shareState(playbackState)
		}
	}

	shareState(playbackState: SyncState = this.playbackState) {
		console.debug('%cSENDING STATE %o', 'color: lightblue; font-weight: bold;', playbackState)

		const { roomID } = playbackState

		this.port.postMessage({
			type: 'sync',
			roomID,
			playbackState,
		})

		if (playbackState.playerState !== PlayerState.BUFFERING) {
			this.setState({
				syncedStates: [...this.state.syncedStates, playbackState],
			})
		}
	}

	get lastSyncedState() {
		return this.state.syncedStates[this.state.syncedStates.length - 1]
	}

	getCurrentVideoID(): string {
		const videoURL = new URL(this.moviePlayer.getVideoUrl())
		return videoURL.searchParams.get('v')
	}

	getCurrentPlayerState(): PlayerState {
		const ytCode: YT.PlayerState = this.moviePlayer.getPlayerState()
		const code: NumericPlayerState = (ytCode as unknown) as NumericPlayerState
		return toPlayerState(code)
	}

	get playbackState(): SyncState {
		const { roomID, userID, sessionID } = this.state

		return {
			roomID,
			userID,
			sessionID,
			videoID: this.getCurrentVideoID(),
			mediaOffset: this.moviePlayer.getCurrentTime(),
			playerState: this.getCurrentPlayerState(),
			timestamp: Date.now(),
		}
	}

	setupBackgroundPort() {
		const scriptElement = querySelectorOne(
			document,
			`script#${pageScriptID}`
		) as HTMLScriptElement

		const scriptSourceURL = new URL(scriptElement.src)
		const extensionID = scriptSourceURL.host

		const port = chrome.runtime.connect(extensionID)
		port.onDisconnect.addListener(this.onPortDisconnect)
		port.onMessage.addListener(this.onMessage)

		this.port = port
	}

	handleRoomIDChange = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
		const items = {
			roomID: data.value,
		}

		this.port.postMessage({
			type: 'config.set',
			items,
		})

		this.setState(items)
	}

	handleUserIDChange = (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
		const userID = data.value

		this.port.postMessage({
			type: 'config.set',
			items: { userID },
		})

		this.setState({
			userID,
		})
	}

	handleSyncToggle = (event: React.FormEvent<HTMLInputElement>, checkboxProps: CheckboxProps) => {
		const syncEnabled = checkboxProps.checked
		const action = syncEnabled ? 'subscribe' : 'unsubscribe'

		trace: `Issuing ${action} action for ${this.state.roomID}`

		this.port.postMessage({
			type: action,
			roomID: this.state.roomID,
		})

		this.setState({ syncEnabled })

		if (syncEnabled) this.shareState()
	}

	render() {
		if (this.state.loading) {
			return 'Loading...'
		}

		const { lastSyncedState } = this

		return (
			<div className="ytsync-ui" style={{ margin: '1em' }}>
				<Segment>
					<Grid divided>
						<GridColumn width="8">
							<h2>Last synced state:</h2>
							{lastSyncedState && <PlaybackState data={lastSyncedState} />}
						</GridColumn>
						<GridColumn width="8">
							<Form size="big">
								<FormGroup>
									<FormCheckbox
										toggle
										label="Enable synchronization"
										name="syncEnabled"
										checked={this.state.syncEnabled}
										onChange={this.handleSyncToggle}
									/>
								</FormGroup>
								<FormGroup>
									<FormInput
										label="Username"
										name="userID"
										value={this.state.userID}
										onChange={this.handleUserIDChange}
										width={6}
									/>
									<FormInput
										label="Room"
										name="roomID"
										value={this.state.roomID}
										onChange={this.handleRoomIDChange}
										width={6}
									/>
								</FormGroup>
							</Form>
						</GridColumn>
					</Grid>
				</Segment>
			</div>
		)
	}

	onPortDisconnect(thisPort: chrome.runtime.Port) {
		const reason = chrome.runtime.lastError?.message
		console.error(`background port disconnected: ${reason}`)
	}

	onMessage(event: MessagesFromBackground) {
		switch (event.type) {
			case 'sync':
				this.handleSyncEvent(event)
				break
			case 'config.get.response':
				this.handleConfigGetResponse(event)
				break
			default:
				throw new Error('unhandled event type')
		}
	}

	handleConfigGetResponse(event: ConfigGetResponse) {
		// @ts-expect-error: bug in typedefs for react?
		this.setState({
			...event.items,
			loading: false,
		})
	}

	handleSyncEvent(event: SyncEvent) {
		const receivedState: SyncState = event.playbackState

		const { playbackState } = this

		// only react to state shared by others
		if (receivedState.sessionID === this.state.sessionID) {
			return
		}

		// only react to events for our room
		if (receivedState.roomID !== this.state.roomID) {
			return
		}

		if (receivedState.playerState !== PlayerState.BUFFERING) {
			this.setState({
				syncedStates: [...this.state.syncedStates, receivedState],
			})
		}

		// @ts-expect-error
		trace: 'RECEIVED', receivedState

		if (receivedState.videoID !== playbackState.videoID) {
			// @ts-expect-error
			trace: 'LOADING', receivedState

			this.setState({ loadingVideoID: receivedState.videoID })

			// @ts-expect-error
			document.querySelector('ytd-watch-flexy').fire('yt-navigate', {
				endpoint: { watchEndpoint: { videoId: receivedState.videoID } },
			})

			return
		}

		switch (receivedState.playerState) {
			case PlayerState.PLAYING:
				trace: `<-sync playing at ${receivedState.mediaOffset}`
				this.moviePlayer.seekTo(receivedState.mediaOffset, true)
				this.moviePlayer.playVideo()
				return

			case PlayerState.PAUSED:
				trace: `<-sync pausing at ${receivedState.mediaOffset} due to remote ${receivedState.playerState}`
				this.moviePlayer.pauseVideo()
				this.moviePlayer.seekTo(receivedState.mediaOffset, true)
				return

			case PlayerState.BUFFERING:
				// @ts-expect-error
				trace: 'remote is buffering', receivedState
				return

			case PlayerState.UNSTARTED:
				trace: `remote video is UNSTARTED ${receivedState.videoID}`

				if (playbackState.videoID !== receivedState.videoID) {
					trace: `SYNC loading new video ${receivedState.videoID}`

					this.moviePlayer.loadVideoById(receivedState.videoID)
				}
				return
		}

		console.error(`no handler for received playerState: ${receivedState.playerState}`)
	}
}
