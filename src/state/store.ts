import { Action, configureStore } from '@reduxjs/toolkit'
import { ThunkAction } from 'redux-thunk'
import { rootReducer, RootState } from './rootReducer'

export type AppDispatch = typeof store.dispatch
export type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>

export const store = configureStore({
	reducer: rootReducer,
})