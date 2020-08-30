import { YouTubeMoviePlayer } from '../../types/YouTubeMoviePlayer'
import { NumericPlaybackVerb, toPlaybackVerb } from '../../types/PlaybackVerb'

export function getCurrentPlaybackVerb(moviePlayer: YouTubeMoviePlayer) {
	const ytCode: YT.PlayerState = moviePlayer.getPlayerState()
	const code: NumericPlaybackVerb = (ytCode as unknown) as NumericPlaybackVerb
	return toPlaybackVerb(code)
}
