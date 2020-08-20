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
import { PlaybackState } from './PlaybackState'
import { SyncState } from '../types/SyncState'
import { NumericPlayerState, PlayerState, toPlayerState } from '../types/PlayerState'
import {
	SyncEvent,
	ConfigGetRequest,
	MessagesFromBackground,
	ConfigGetResponse,
} from '../types/extensionMessages'
import { isSeekInitiatedByUser, isStateChangeInitiatedByUser } from '../util/userIntentionDetectors'
import { querySelectorOne } from '../util/querySelectorOne'

interface SyncUIState {
	loading: boolean
	userID: string
	roomID: string
	sessionID: string
	localPlayerState: PlayerState
	syncedStates: SyncState[]
	syncEnabled: boolean
}

export class SyncUI extends React.Component<{}, SyncUIState> {
	moviePlayer: YT.Player
	videoElm: HTMLVideoElement
	port: chrome.runtime.Port

	constructor(props: {}) {
		super(props)

		this.state = {
			loading: true,
			roomID: null,
			userID: null,
			sessionID: cryptoRandomString({ length: 12, type: 'url-safe' }),
			// roomID: cryptoRandomString({ length: 12, type: 'url-safe' }),
			// userID: cryptoRandomString({ length: 6, type: 'url-safe' }),
			syncedStates: [],
			localPlayerState: null,
			syncEnabled: false,
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
		this.moviePlayer = querySelectorOne(document, '#movie_player')
		this.moviePlayer.addEventListener('onStateChange', this.onStateChange)

		this.videoElm = querySelectorOne(this.moviePlayer, 'video')
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

		this.shareState(playbackState)
	}

	onStateChange(newStateCode: NumericPlayerState) {
		const newState: PlayerState = toPlayerState(newStateCode)
		const { playbackState, lastSyncedState } = this

		const previousState = this.state.localPlayerState

		if (newState !== PlayerState.BUFFERING) {
			this.setState({ localPlayerState: newState })
		}

		console.debug(`onStateChange ${previousState} -> ${newState}`, playbackState)

		const { byUser, decidedBy, reason } = isStateChangeInitiatedByUser(newState, this)

		if (!byUser) {
			console.debug('IGNORE', 'onStateChange', newState, 'due to:', reason, `(${decidedBy})`)
			return
		}

		this.shareState(playbackState)
	}

	shareState(playbackState: SyncState) {
		if (!this.state.syncEnabled) return

		console.debug('%cSENDING STATE %o', 'color: lightblue; font-weight: bold;', playbackState)

		const { roomID } = this.state

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
		this.port = chrome.runtime.connect('mmfgacfcjdhhobbicplipgeablenfego')
		this.port.onDisconnect.addListener(this.onPortDisconnect)
		this.port.onMessage.addListener(this.onMessage)
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

	handleSyncToggle = (
		event: React.FormEvent<HTMLInputElement>,
		{ name, checked }: CheckboxProps
	) => {
		const action = checked ? 'subscribe' : 'unsubscribe'
		trace: `Issuing ${action} action for ${this.state.roomID}`
		this.port.postMessage({
			type: action,
			roomID: this.state.roomID,
		})
		this.setState({ syncEnabled: checked })
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
		// bug in typedefs for react?
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

		trace: '%cRECEIVED %o', 'color: green; font-weight: bold;', receivedState

		if (receivedState.videoID !== playbackState.videoID) {
			trace: 'LOADING', receivedState
			// this.moviePlayer.loadVideoById(receivedState.videoID)
			document.location.href = `https://www.youtube.com/watch?v=${receivedState.videoID}`
			return
		}

		switch (receivedState.playerState) {
			case PlayerState.PLAYING:
				trace: '<-sync playing at', receivedState.mediaOffset
				this.moviePlayer.seekTo(receivedState.mediaOffset, true)
				this.moviePlayer.playVideo()
				return

			case PlayerState.PAUSED:
				trace: `<-sync pausing at ${receivedState.mediaOffset} due to remote ${receivedState.playerState}`
				this.moviePlayer.pauseVideo()
				this.moviePlayer.seekTo(receivedState.mediaOffset, true)
				return

			case PlayerState.BUFFERING:
				trace: '%cremote is buffering', 'background-color: yellow', receivedState
				return

			case PlayerState.UNSTARTED:
				trace: '%cremote video is UNSTARTED %s',
					'background-color: #d91abf',
					receivedState.videoID

				if (playbackState.videoID !== receivedState.videoID) {
					trace: '%c SYNC loading new video %s',
						'background-color: #d91abf',
						receivedState.videoID

					this.moviePlayer.loadVideoById(receivedState.videoID)
				}
				return
		}

		console.error('unhandled onMessage')
	}
}
