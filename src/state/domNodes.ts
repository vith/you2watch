import { createAction } from '@reduxjs/toolkit'

export const foundMoviePlayer = createAction('dom/foundMoviePlayer',
	(sessionID: string) => ({
		payload: { sessionID }
	})
)

export const foundVideoElement = createAction('dom/foundVideoElement',
	(sessionID: string) => ({
		payload: { sessionID }
	})
)
