import { PlaybackVerb } from './PlaybackVerb'
import { PlayerState } from './SyncState'

type Decider<T_Event> = (
	event: T_Event,
	newPlayerState: PlayerState,
	goalState: PlayerState
) => DeciderDecision

type DeciderDecision = {
	byUser: boolean
	reason: string
}

type Decision = DeciderDecision & {
	decidedBy: string
}

type DeciderMap<EventType> = {
	[key: string]: Decider<EventType>
}

export function isStateChangeInitiatedByUser(
	newPlaybackVerb: PlaybackVerb,
	newPlayerState: PlayerState,
	goalState: PlayerState
): Decision {
	const deciders: DeciderMap<PlaybackVerb> = {
		ignoreBuffering(
			newPlaybackVerb: PlaybackVerb,
			newPlayerState: PlayerState,
			goalState: PlayerState
		): DeciderDecision {
			if (newPlaybackVerb === PlaybackVerb.BUFFERING) {
				return {
					byUser: false,
					reason: 'buffering',
				}
			}
		},

		ignoreTransitionToGoalState(
			newPlaybackVerb: PlaybackVerb,
			newPlayerState: PlayerState,
			goalState: PlayerState
		): DeciderDecision {
			if (!goalState) return

			if (newPlaybackVerb === goalState.playbackVerb) {
				return {
					byUser: false,
					reason: 'transition to goal state',
				}
			}
		},
	}

	return isInitiatedByUser(
		deciders,
		newPlaybackVerb,
		newPlayerState,
		goalState
	)
}

export function isSeekInitiatedByUser(
	seekingEvent: Event,
	newPlayerState: PlayerState,
	goalState: PlayerState
) {
	const deciders = {
		noGoalState(
			seekingEvent: Event,
			newPlayerState: PlayerState,
			goalState: PlayerState
		) {
			if (!goalState) {
				return { byUser: true, reason: 'no goalState' }
			}
		},

		ignoreSeekCausedBySync(
			seekingEvent: Event,
			newPlayerState: PlayerState,
			goalState: PlayerState
		) {
			if (
				Math.abs(newPlayerState.mediaOffset - goalState.mediaOffset) >
				0.5
			) {
				return { byUser: true, reason: 'mediaOffset differs' }
			} else {
				return { byUser: false, reason: 'mediaOffset matches' }
			}
		},
	}

	return isInitiatedByUser(deciders, seekingEvent, newPlayerState, goalState)
}

function isInitiatedByUser<EventType>(
	deciders: DeciderMap<EventType>,
	...args: Parameters<Decider<EventType>>
) {
	for (const [decidedBy, decider] of Object.entries(deciders)) {
		const decision = decider(...args)
		if (decision !== undefined) {
			return { ...decision, decidedBy }
		}
	}

	return { byUser: true, decidedBy: undefined, reason: 'default decision' }
}
