import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSync } from '../features/sync/thunks/toggleSync'
import { updateConfig } from '../state/config'
import { RootState } from '../state/store'

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
		dispatch(toggleSync(checked))
	}

	const hasUserIDChange = editingUserID !== savedUserID
	const hasRoomID = editingRoomID !== savedRoomID
	const hasChanges = hasUserIDChange || hasRoomID

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		if (hasUserIDChange)
			dispatch(updateConfig({ userID: editingUserID }))

		if (hasRoomID)
			dispatch(updateConfig({ roomID: editingRoomID }))
	}

	return (
		<div className="youtoo-header-dropdown">
			<div className="youtoo-field">
				<input
					type="checkbox"
					name="syncEnabled"
					checked={syncEnabled}
					onChange={onChangeSyncEnabled}
				/>
			</div>
			<form onSubmit={onSubmit}>
				<div className="youtoo-field">
					<label htmlFor="userID">Username</label>
					<input
						type="text"
						name="userID"
						value={editingUserID}
						onChange={onChangeUserID}
					/>
				</div>
				<div className="youtoo-field">
					<label htmlFor="roomID">Room</label>
					<input
						type="text"
						name="roomID"
						value={editingRoomID}
						onChange={onChangeRoomID}
					/>
				</div>
				<div className="youtoo-field">
					<button type="submit" disabled={!hasChanges}>
						Save
					</button>
				</div>
			</form>
		</div>
	)
}
