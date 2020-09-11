import { syncStateWithPeers } from '../features/sync/sync'
import { actionsToForwardToBackground } from '../middleware/forwardActionsToBackground'
import { ConfigChangedAction, configLoaded } from '../state/config'

export type MessagesFromPage = ReturnType<
	typeof actionsToForwardToBackground[number]
>

export type MessagesFromBackground =
	| ReturnType<typeof syncStateWithPeers>
	| ReturnType<typeof configLoaded>
	| ConfigChangedAction
