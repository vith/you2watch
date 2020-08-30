import { SyncOutlined } from '@ant-design/icons'
import React from 'react'
import { Provider } from 'react-redux'
import { store } from '../state/store'
import { YouTooDropdown } from './YouTooDropdown'
import './YouTubeHeaderButton.css'

export function YouTubeHeaderButton() {
	return (
		<div className="youtoo-header-button">
			<SyncOutlined style={{ fontSize: '16px' }} />
			<YouTooDropdown />
		</div>
	)
}
