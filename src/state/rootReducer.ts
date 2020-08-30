import { combineReducers } from '@reduxjs/toolkit'
import { syncSlice } from '../features/sync/sync'
import { configSlice } from './config'

export const rootReducer = combineReducers({
	config: configSlice.reducer,
	sync: syncSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>
