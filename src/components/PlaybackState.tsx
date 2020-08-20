import React from 'react'
import TimeAgo from 'react-timeago'
import { Icon, Label } from 'semantic-ui-react'
import { SyncState } from '../types/SyncState'

export function PlaybackState(props: { data: SyncState }) {
	const {
		data: { roomID, userID, videoID, mediaOffset, playerState, timestamp },
	} = props

	const rowStyle = { margin: '0.35em' }

	return (
		<>
			<div style={rowStyle}>
				<Label size="big">
					<Icon name="user" color="brown" />
					{userID}
				</Label>
				<Label size="big">
					<Icon name="home" color="green" />
					{roomID}
				</Label>
				<Label size="big">
					<Icon name="video" color="red" />
					{videoID}
				</Label>
			</div>
			<div style={rowStyle}>
				<Label size="big">
					<Icon name="video play" color="violet" />
					{Math.round(mediaOffset)}
				</Label>
				<Label size="big">
					<Icon name="question" color="orange" />
					{playerState}
				</Label>
				<Label size="big">
					<Icon name="time" />
					<TimeAgo date={timestamp} />
				</Label>
			</div>
		</>
	)
}
