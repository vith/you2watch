import { PlayerState } from '../types/playerState'

export function isStateChangeInitiatedByUser(newState: PlayerState, syncService) {
	const deciders = {
		ignoreTransitionToLastSyncedState(newState: PlayerState, syncService) {
			const { lastSyncedState } = syncService

			if (!lastSyncedState) {
				return
			}

			if (newState === lastSyncedState.playerState) {
				return {
					byUser: false,
					reason: 'transition to last synced state',
				}
			}
		},
	}

	return isInitiatedByUser(deciders, newState, syncService)
}

export function isSeekInitiatedByUser(seekingEvent, lastSyncedState, currentState) {
	const deciders = {
		noLastSyncedState(seekingEvent, lastSyncedState, currentState) {
			if (!lastSyncedState) {
				return { byUser: true, reason: 'no lastSyncedState' }
			}
		},

		ignoreSeekCausedBySync(seekingEvent, lastSyncedState, currentState) {
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

function isInitiatedByUser(deciders, ...args) {
	for (const decider of Object.values(deciders)) {
		const decision = decider(...args)
		if (decision !== undefined) {
			return { ...decision, decidedBy: decider.name }
		}
	}

	return { byUser: true, decidedBy: undefined, reason: 'default decision' }
}
