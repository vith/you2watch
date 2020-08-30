export enum NumericPlaybackVerb {
	UNSTARTED = -1,
	ENDED = 0,
	PLAYING = 1,
	PAUSED = 2,
	BUFFERING = 3,
	CUED = 5,
}

export enum PlaybackVerb {
	UNSTARTED = 'UNSTARTED',
	ENDED = 'ENDED',
	PLAYING = 'PLAYING',
	PAUSED = 'PAUSED',
	BUFFERING = 'BUFFERING',
	CUED = 'CUED',
}

export function toPlaybackVerb(code: NumericPlaybackVerb): PlaybackVerb {
	return NumericPlaybackVerb[code] as PlaybackVerb
}
