import {
	createAction,
	createAsyncThunk,
	createSlice,
	PayloadAction,
} from '@reduxjs/toolkit'
import { postActionToBackground } from '../features/sync/sync'
import { Config } from '../types/Config'
import { MessagesFromBackground } from '../types/extensionMessages'
import { SessionID } from '../types/SyncState'
import { GlobalStateContainer } from './notSafeForRedux'
import { AppThunk, AppThunkApi } from './store'

export type ConfigChangedAction = PayloadAction<Partial<Config>>

export const configSlice = createSlice({
	name: 'config',
	initialState: {
		userID: 'somebody',
		roomID: 'somewhere',
	},
	reducers: {
		configChanged: (state, action: ConfigChangedAction) => {
			Object.assign(state, action.payload)
		},
	},
})

export const updateConfig = (
	partialConfig: Partial<Config>
): AppThunk => async (dispatch, getState) => {
	const state = getState()
	const { sessionID } = state.sync

	const configChangedAction = configChanged(partialConfig)

	postActionToBackground(sessionID, configChangedAction)
	dispatch(configChangedAction)
}

export const configRequest = createAction('config/request')
export const configResponse = createAction<Config>('config/response')

export const getConfig = createAsyncThunk<Config, void, AppThunkApi>(
	'config/get',
	async (_, thunkApi) => {
		const { sessionID } = thunkApi.getState().sync
		postActionToBackground(sessionID, configRequest())
		const config: Config = await waitForConfigResponse(sessionID)
		return config
	}
)

export const loadConfigFromBackground = createAsyncThunk<
	Config,
	void,
	AppThunkApi
>('config/loadFromBackground', async (_, thunkApi) => {
	const { sessionID } = thunkApi.getState().sync
	postActionToBackground(sessionID, configRequest())
	const config: Config = await waitForConfigResponse(sessionID)
	thunkApi.dispatch(configChanged(config))
	return config
})

function waitForConfigResponse(sessionID: SessionID): Promise<Config> {
	const { port } = GlobalStateContainer.getState(sessionID)

	return new Promise(resolve => {
		function getNextConfigResponse(event: MessagesFromBackground) {
			if (configResponse.match(event)) {
				port.onMessage.removeListener(getNextConfigResponse)
				resolve(event.payload)
			}
		}
		port.onMessage.addListener(getNextConfigResponse)
	})
}

export const { configChanged } = configSlice.actions

export const configReducer = configSlice.reducer
