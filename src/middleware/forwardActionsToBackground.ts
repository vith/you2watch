import { Middleware } from '@reduxjs/toolkit'
import {
	subscribeToRoom,
	syncStateWithPeers,
	unsubscribeFromRoom,
} from '../features/sync/sync'
import { changeConfig, requestFromBackground } from '../state/config'
import { GlobalStateContainer } from '../state/notSafeForRedux'
import { baseLog } from '../util/logging'

export const actionsToForwardToBackground = [
	subscribeToRoom,
	unsubscribeFromRoom,
	changeConfig,
	requestFromBackground,
	syncStateWithPeers,
] as const

const log = baseLog.extend('actionForwarder')

export const forwardActionsToBackground: Middleware = store => next => action => {
	// check if action should be forwarded
	if (
		!action._forwarded &&
		actionsToForwardToBackground.some(forwardable =>
			forwardable.match(action)
		)
	) {
		const { sessionID } = store.getState().sync
		const { port } = GlobalStateContainer.getState(sessionID)
		const actionToForward = {
			...action,
			_forwarded: true,
		}
		log('forwarding action to background', actionToForward)
		port.postMessage(actionToForward)
	}

	return next(action)
}
