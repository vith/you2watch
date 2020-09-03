import { SyncOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../state/store'
import './YouTubeHeaderButton.css'

type YouTubeHeaderButtonProps = {
	onHeaderButtonClicked: () => void
}

export function YouTubeHeaderButton(props: YouTubeHeaderButtonProps) {
	const syncEnabled = useSelector(
		(state: RootState) => state.sync.syncEnabled
	)

	return (
		<button
			className={classNames('youtoo-header-button', {
				'youtoo-enabled': syncEnabled,
			})}
			onClick={props.onHeaderButtonClicked}
		>
			<span>Sync</span>
			<SyncOutlined style={{ fontSize: '16px' }} />
		</button>
	)
}
