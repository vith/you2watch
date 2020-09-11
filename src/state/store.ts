import {
	Action,
	combineReducers,
	configureStore,
	getDefaultMiddleware,
} from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import { syncSlice } from '../features/sync/sync'
import { forwardActionsToBackground } from '../middleware/forwardActionsToBackground'
import { configSlice } from './config'
import { domNodesSlice } from './domNodes'
import { portSlice } from './port'

export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>
export type AppThunkApi = {
	dispatch: AppDispatch
	state: RootState
}

export const rootReducer = combineReducers({
	config: configSlice.reducer,
	sync: syncSlice.reducer,
	port: portSlice.reducer,
	domNodes: domNodesSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const store = configureStore({
	reducer: rootReducer,
	middleware: getDefaultMiddleware().concat([forwardActionsToBackground]),
})

export type AppDispatch = typeof store.dispatch

export type AppStore = typeof store
