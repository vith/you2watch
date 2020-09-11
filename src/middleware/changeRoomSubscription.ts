import { Middleware } from '@reduxjs/toolkit'
import { subscribeToRoom, unsubscribeFromRoom } from '../features/sync/sync'
import { configChanged } from '../state/config'
import { baseLog } from '../util/logging'

const log = baseLog.extend('changeRoomSubscription')

export const changeRoomSubscription: Middleware = store => next => action => {
	if (configChanged.match(action)) {
		const changes = action.payload
		const changedKeys = Object.keys(changes)
		if (changedKeys.includes('roomID')) {
			const { newValue, oldValue } = changes.roomID
			log('room changed from %j to %j', oldValue, newValue)
			if (store.getState().sync.syncEnabled) {
				log('subscribing to %j', newValue)
				store.dispatch(subscribeToRoom(newValue))

				log('unsubscribing from %j', oldValue)
				store.dispatch(unsubscribeFromRoom(oldValue))
			}
		}
	}

	return next(action)
}
