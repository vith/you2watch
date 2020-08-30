import { YouTubeMoviePlayer } from "../types/YouTubeMoviePlayer"

type NonSerializableSessionState = {
	port: chrome.runtime.Port
	moviePlayer: YouTubeMoviePlayer
	videoElement: HTMLVideoElement
}

class NotSafeForReduxStateContainer {
	private sessionState = new Map<string, NonSerializableSessionState>()

	getState(sessionID: string): NonSerializableSessionState {
		return this.sessionState.get(sessionID)
	}

	setState(sessionID: string, partialState: Partial<NonSerializableSessionState>) {
		const currentState = this.getState(sessionID)
		this.sessionState.set(sessionID, {
			...currentState,
			...partialState,
		})
	}

	deleteState(sessionID: string) {
		this.sessionState.delete(sessionID)
	}
}

export const GlobalStateContainer = new NotSafeForReduxStateContainer()

// @ts-expect-error
window.hax = GlobalStateContainer // TODO: remove hax
