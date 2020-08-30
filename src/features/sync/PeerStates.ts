import { SessionID, SyncState } from '../../types/SyncState'

// type PeerStates = {
// 	// wtf? https://github.com/microsoft/TypeScript/issues/1778
// 	[peerID: /* SessionID */ string]: SyncState
// }

export type PeerStates = Record<SessionID, SyncState>
