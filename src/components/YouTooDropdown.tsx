import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { saveRoomID, saveUserID } from '../state/config'
import { RootState } from '../state/rootReducer'
import { setSyncEnabled } from '../features/sync/thunks/setSyncEnabled'

export function YouTooDropdown() {
	const dispatch = useDispatch()

	const savedUserID = useSelector((state: RootState) => state.config.userID)
	const savedRoomID = useSelector((state: RootState) => state.config.roomID)
	const syncEnabled = useSelector((state: RootState) => state.sync.syncEnabled)

	const [editingUserID, setEditingUserID] = useState(savedUserID)
	const [editingRoomID, setEditingRoomID] = useState(savedRoomID)


	const onChangeUserID = (e: React.ChangeEvent<HTMLInputElement>) =>
		setEditingUserID(e.target.value)
	const onChangeRoomID = (e: React.ChangeEvent<HTMLInputElement>) =>
		setEditingRoomID(e.target.value)
	const onChangeSyncEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target
		dispatch(setSyncEnabled(checked))
	}

	const hasUserIDChange = editingUserID !== savedUserID
	const hasRoomID = editingRoomID !== savedRoomID
	const hasChanges = hasUserIDChange || hasRoomID

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (hasUserIDChange)
			dispatch(saveUserID(editingUserID))

		if (hasRoomID)
			dispatch(saveRoomID(editingRoomID))
	}

	return (
		<div className="youtoo-header-dropdown">
			<input
				type="checkbox"
				name="syncEnabled"
				checked={syncEnabled}
				onChange={onChangeSyncEnabled}
			/>
			<form onSubmit={onSubmit}>
				<div className="field">
					<label htmlFor="userID">Username</label>
					<input
						type="text"
						name="userID"
						value={editingUserID}
						onChange={onChangeUserID}
					/>
				</div>
				<div className="field">
					<label htmlFor="roomID">Room</label>
					<input
						type="text"
						name="roomID"
						value={editingRoomID}
						onChange={onChangeRoomID}
					/>
				</div>
				<button type="submit" disabled={!hasChanges}>
					Save
				</button>
			</form>
		</div>
	)
}
