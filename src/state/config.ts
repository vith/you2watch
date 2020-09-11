import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Config } from '../types/Config'
import { MessagesFromBackground } from '../types/extensionMessages'
import { SessionID } from '../types/SyncState'
import { baseLog } from '../util/logging'
import { GlobalStateContainer } from './notSafeForRedux'
import { AppThunkApi } from './store'

const log = baseLog.extend('config')

export type ConfigChangedAction = PayloadAction<{
	[key: string]: chrome.storage.StorageChange
}>
export type ConfigChangeAction = PayloadAction<Partial<Config>>
export type ConfigLoadedAction = PayloadAction<Config>

export const configSlice = createSlice({
	name: 'config',
	initialState: {
		userID: null,
		roomID: null,
	},
	reducers: {
		changeConfig: (state, action: ConfigChangeAction) => {
			Object.assign(state, action.payload)
		},
		configChanged: (state, action: ConfigChangedAction) => {
			// don't update state when stored config changes, so different tabs
			// can be subscribed to different rooms or have different usernames
			/* const partialConfig = Object.fromEntries(
				Object.entries(action.payload).map(([key, changes]) => [
					key,
					changes.newValue,
				])
			)
			Object.assign(state, partialConfig) */
		},
		requestFromBackground: () => {},
		configLoaded: (state, action: ConfigLoadedAction) => {
			Object.assign(state, action.payload)
		},
	},
})

export const loadConfigFromBackground = createAsyncThunk<
	Config,
	void,
	AppThunkApi
>('config/loadFromBackground', async (_, thunkApi) => {
	const { sessionID } = thunkApi.getState().sync
	const configLoadedPromise = waitForConfigLoaded(sessionID)
	thunkApi.dispatch(requestFromBackground())
	const config: Config = await configLoadedPromise
	return config
})

function waitForConfigLoaded(sessionID: SessionID): Promise<Config> {
	const { port } = GlobalStateContainer.getState(sessionID)

	return new Promise(resolve => {
		function listenForNextConfigLoadedAction(
			event: MessagesFromBackground
		) {
			if (configLoaded.match(event)) {
				port.onMessage.removeListener(listenForNextConfigLoadedAction)
				resolve(event.payload)
			}
		}
		port.onMessage.addListener(listenForNextConfigLoadedAction)
	})
}

export const {
	changeConfig,
	configChanged,
	configLoaded,
	requestFromBackground,
} = configSlice.actions

export const configReducer = configSlice.reducer
