import cryptoRandomString from 'crypto-random-string'
import 'fomantic-ui-css/semantic.css'
import React from 'react'
import ReactDOM from 'react-dom'
import TimeAgo from 'react-timeago'
import {
	Form,
	FormCheckbox,
	FormGroup,
	FormInput,
	Grid,
	GridColumn,
	Icon,
	Label,
	Segment,
} from 'semantic-ui-react'
import { NumericPlayerState, PlayerState, SyncState, toPlayerState } from './types'
import { isSeekInitiatedByUser, isStateChangeInitiatedByUser } from './userIntentionDetectors'
import { querySelectorOne } from './util/querySelectorOne'
import { waitForElement } from './util/wait-for-element'

interface SyncUIProps {}
interface SyncUIState {
	roomID: string
	userID: string
	localPlayerState: PlayerState
	syncedStates: SyncState[]
	syncEnabled: boolean
}

const PlaybackState = (props: { data: SyncState }) => {
	const {
		data: { roomID, userID, videoID, mediaOffset, playerState, timestamp },
	} = props

	const rowStyle = { margin: '0.35em' }

	return (
		<>
			<div style={rowStyle}>
				<Label size="big">
					<Icon name="user" color="brown" />
					{userID}
				</Label>
				<Label size="big">
					<Icon name="home" color="green" />
					{roomID}
				</Label>
				<Label size="big">
					<Icon name="video" color="red" />
					{videoID}
				</Label>
			</div>
			<div style={rowStyle}>
				<Label size="big">
					<Icon name="video play" color="violet" />
					{Math.round(mediaOffset)}
				</Label>
				<Label size="big">
					<Icon name="question" color="orange" />
					{playerState}
				</Label>
				<Label size="big">
					<Icon name="time" />
					<TimeAgo date={timestamp} />
				</Label>
			</div>
		</>
	)
}

class SyncUI extends React.Component<SyncUIProps, SyncUIState> {
	moviePlayer: YT.Player
	videoElm: HTMLVideoElement
	port: chrome.runtime.Port

	constructor(props: SyncUIProps) {
		super(props)
		this.state = {
			roomID: cryptoRandomString({ length: 12, type: 'url-safe' }),
			userID: cryptoRandomString({ length: 6, type: 'url-safe' }),
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
	}

	setupPlayerHandlers() {
		this.moviePlayer = querySelectorOne(document, '#movie_player')
		this.moviePlayer.addEventListener('onStateChange', this.onStateChange)

		this.videoElm = querySelectorOne(this.moviePlayer, 'video')
		this.videoElm.addEventListener('seeking', this.onSeeking)
	}

	onSeeking(seekingEvent: Event) {
		const { playbackState, lastSyncedState } = this

		trace: 'onSeeking', seekingEvent, playbackState

		const { byUser, decidedBy, reason } = isSeekInitiatedByUser(
			seekingEvent,
			lastSyncedState,
			playbackState
		)

		if (!byUser) {
			trace: 'IGNORE', 'seeking', seekingEvent, 'due to:', reason, `(${decidedBy})`
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

		trace: 'onStateChange', `${previousState} -> ${newState}`, playbackState

		const { byUser, decidedBy, reason } = isStateChangeInitiatedByUser(newState, this)

		if (!byUser) {
			trace: 'IGNORE', 'onStateChange', newState, 'due to:', reason, `(${decidedBy})`
			return
		}

		this.shareState(playbackState)
	}

	shareState(playbackState: SyncState) {
		trace: '%cSENDING STATE %o', 'color: lightblue; font-weight: bold;', playbackState
		this.port.postMessage(playbackState)

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
		return {
			roomID: this.state.roomID,
			userID: this.state.userID,
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

	handleFormChange = (e, { name, value }) => this.setState({ [name]: value })

	handleCheckboxChange = (e, { name, checked }) => this.setState({ [name]: checked })

	render() {
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
										onChange={this.handleCheckboxChange}
									/>
								</FormGroup>
								<FormGroup>
									<FormInput
										label="Username"
										name="userID"
										value={this.state.userID}
										onChange={this.handleFormChange}
										width={6}
									/>
									<FormInput
										label="Room"
										name="roomID"
										value={this.state.roomID}
										onChange={this.handleFormChange}
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
		const reason = chrome.runtime.lastError.message
		console.error('background port disconnected', reason)
	}

	onMessage(receivedState: SyncState) {
		const { playbackState } = this

		// only react to state shared by others
		if (receivedState.userID === this.state.userID) {
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

async function main() {
	trace: 'loading sync runtime'

	const syncUiMountPoint = document.createElement('div')
	syncUiMountPoint.id = 'sync-ui'

	trace: 'waiting for #primary-inner > #info'
	// search for #info under #primary-inner because youtube frontend has 5 different #info elements...
	// const infoElm: Element = await waitForElement(document, '#primary-inner > #info')
	const htmlElm: Element = await waitForElement(document, 'html')
	trace: 'found html'
	const primaryInnerElm: Element = await waitForElement(htmlElm, '#primary-inner')
	trace: 'found #primary-inner'
	const infoElm: Element = await waitForElement(primaryInnerElm, '#primary-inner > #info')
	trace: 'found #primary-inner > #info'

	infoElm.parentNode.insertBefore(syncUiMountPoint, infoElm)

	ReactDOM.render(<SyncUI />, syncUiMountPoint)

	trace: 'sync runtime loaded'
}

main()
