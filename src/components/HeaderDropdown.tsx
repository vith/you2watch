import React, { useRef, useState } from 'react'
import { useRootClose } from 'react-overlays'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSync } from '../features/sync/thunks/toggleSync'
import { updateConfig } from '../state/config'
import { RootState } from '../state/store'
import { baseLog } from '../util/logging'

const log = baseLog.extend(HeaderDropdown.name)

type HeaderDropdownProps = {
	closeDropdown: () => void
}

export function HeaderDropdown(props: HeaderDropdownProps) {
	const dispatch = useDispatch()
	const ref = useRef<HTMLDivElement>()

	// TODO: check for leak?
	// can't nest this in a useEffect to define dependency on ref
	log('setting up useRootClose', ref.current)
	useRootClose(ref, () => {
		log('closing dropdown via useRootClose')
		props.closeDropdown()
	})

	const savedUserID = useSelector((state: RootState) => state.config.userID)
	const savedRoomID = useSelector((state: RootState) => state.config.roomID)
	const syncEnabled = useSelector(
		(state: RootState) => state.sync.syncEnabled
	)

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

		if (hasUserIDChange) dispatch(updateConfig({ userID: editingUserID }))
		if (hasRoomID) dispatch(updateConfig({ roomID: editingRoomID }))
	}

	return (
		<div className="you2watch-header-dropdown" ref={ref}>
			<div className="you2watch-field">
				<label>
					<input
						type="checkbox"
						name="syncEnabled"
						id="syncEnabled"
						checked={syncEnabled}
						onChange={onChangeSyncEnabled}
					/>
					Enable sync
				</label>
			</div>
			<form onSubmit={onSubmit}>
				<div className="you2watch-field">
					<label htmlFor="userID">Username</label>
					<input
						type="text"
						name="userID"
						autoComplete="off"
						value={editingUserID}
						onChange={onChangeUserID}
					/>
				</div>
				<div className="you2watch-field">
					<label htmlFor="roomID">Room</label>
					<input
						type="text"
						name="roomID"
						autoComplete="off"
						value={editingRoomID}
						onChange={onChangeRoomID}
					/>
				</div>
				<div className="you2watch-field">
					<button type="submit" disabled={!hasChanges}>
						Save
					</button>
				</div>
			</form>
		</div>
	)
}
