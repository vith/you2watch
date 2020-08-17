import { querySelectorOne } from './util/querySelectorOne'
import { PlayerState } from './playerState'

export default class YouTubeDriver {
	constructor(moviePlayer) {
		this.moviePlayer = moviePlayer
		this.videoElm = querySelectorOne(moviePlayer, 'video')
		this.intention = {
			state: undefined,
			position: undefined,
		}
		this.lastState = {
			state: undefined,
			position: undefined,
		}

		this.onStateChange = this.onStateChange.bind(this)
		this.onSeeking = this.onSeeking.bind(this)
		this.moviePlayer.addEventListener('onStateChange', this.onStateChange)
		this.videoElm.addEventListener('seeking', this.onSeeking)
	}

	playAt(position) {
		const { moviePlayer, playerState } = this

		this.intention = {
			state: PlayerState.playing,
			position,
		}

		moviePlayer.seekTo(position)

		if (playerState !== PlayerState.playing) {
			moviePlayer.playVideo()
		}
	}

	pauseAt(position) {
		const { moviePlayer, playerState } = this

		this.intention = {
			state: PlayerState.paused,
			position,
		}

		if (playerState === PlayerState.playing) {
			moviePlayer.pauseVideo()
		}

		moviePlayer.seekTo(position)
	}

	get playerState() {
		const code = this.moviePlayer.getPlayerState()
		const name = PlayerState.fromCode(code)
		return name
	}

	onStateChange(newStateCode) {
		const newState = PlayerState.fromCode(newStateCode)
		const { intention, lastState } = this

		for (const ignoreDecider of Object.values(ignoreDeciders)) {
			const shouldIgnore = ignoreDecider(newState, lastState, intention)
			if (shouldIgnore === true) {
				console.debug(
					'YouTubeDriver:',
					'ignoring new state:',
					newState,
					'due to:',
					ignoreDecider.name
				)
				return
			}
		}

		this.emit('onStateChange', newState)
	}
}

const ignoreDeciders = {
	ignoreBufferingWhenTryingToPlay(newState, lastState, intention) {
		if (
			newState === PlayerState.buffering &&
			intention.state === PlayerState.playing
		)
			return true
	},
}
