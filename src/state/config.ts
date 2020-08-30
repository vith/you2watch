import { createSlice } from '@reduxjs/toolkit'

export const configSlice = createSlice({
	name: 'config',
	initialState: {
		userID: 'somebody',
		roomID: 'somewhere',
	},
	reducers: {
		saveUserID: (state, action) => {
			state.userID = action.payload
		},
		saveRoomID: (state, action) => {
			state.roomID = action.payload
		},
	},
})

export const { saveUserID, saveRoomID } = configSlice.actions

export const configReducer = configSlice.reducer
