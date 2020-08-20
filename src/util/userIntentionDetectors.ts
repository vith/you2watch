import { PlayerState } from '../types/playerState'
import { SyncState } from '../types/SyncState'

type Decider<EventType> = (
	event: EventType,
	lastSyncedState: SyncState,
	currentState: SyncState
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
	newPlayerState: PlayerState,
	lastSyncedState: SyncState,
	currentSyncedState: SyncState
): Decision {
	const deciders: DeciderMap<PlayerState> = {
		ignoreTransitionToLastSyncedState(
			newPlayerState: PlayerState,
			lastSyncedState: SyncState,
			currentSyncedState: SyncState
		): DeciderDecision {
			if (!lastSyncedState) {
				return
			}

			if (newPlayerState === lastSyncedState.playerState) {
				return {
					byUser: false,
					reason: 'transition to last synced state',
				}
			}
		},
	}

	return isInitiatedByUser(deciders, newPlayerState, lastSyncedState, currentSyncedState)
}

export function isSeekInitiatedByUser(
	seekingEvent: Event,
	lastSyncedState: SyncState,
	currentState: SyncState
) {
	const deciders = {
		noLastSyncedState(
			seekingEvent: Event,
			lastSyncedState: SyncState,
			currentState: SyncState
		) {
			if (!lastSyncedState) {
				return { byUser: true, reason: 'no lastSyncedState' }
			}
		},

		ignoreSeekCausedBySync(
			seekingEvent: Event,
			lastSyncedState: SyncState,
			currentState: SyncState
		) {
			const c = currentState
			const l = lastSyncedState

			if (Math.abs(c.mediaOffset - l.mediaOffset) > 0.5) {
				return { byUser: true, reason: 'mediaOffset differs' }
			} else {
				return { byUser: false, reason: 'mediaOffset matches' }
			}
		},
	}

	return isInitiatedByUser(deciders, seekingEvent, lastSyncedState, currentState)
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
