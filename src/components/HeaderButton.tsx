import { SyncOutlined } from '@ant-design/icons'
import classNames from 'classnames'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../state/store'

type HeaderButtonProps = {
	onHeaderButtonClicked: () => void
}

export function HeaderButton(props: HeaderButtonProps) {
	const syncEnabled = useSelector(
		(state: RootState) => state.sync.syncEnabled
	)

	return (
		<button
			className={classNames('you2watch-header-button', {
				'you2watch-enabled': syncEnabled,
			})}
			onClick={props.onHeaderButtonClicked}
		>
			<span>Sync</span>
			<SyncOutlined style={{ fontSize: '16px' }} />
		</button>
	)
}
