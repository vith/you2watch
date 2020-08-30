// import { saveUsername, saveRoom } from './config'
// import { AppDispatch } from './store'
// import { Store, Action, createAction, createReducer } from '@reduxjs/toolkit'

// const actionsToForward = [saveUsername, saveRoom]

// export const forwardAction = createAction('forwardAction')

// export const forwardActionReducer = createReducer(undefined, {
// 	[forwardAction.type]: (state, action) => {

// 	}
// })

// export const forwardActionsToBackground = (store: Store) => (next: AppDispatch) => (
// 	action: Action
// ) => {
// 	if (actionsToForward.some(actionCreator => actionCreator.match(action))) {
// 		const { portToBackground } = store.getState()

// 		portToBackground.postMessage({
// 			type: 'redux-action',
// 			action,
// 		})
// 	}

// 	next(action)
// }
