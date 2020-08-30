import { YouTubeMoviePlayer } from '../../types/YouTubeMoviePlayer'

export function getCurrentVideoID(moviePlayer: YouTubeMoviePlayer) {
	const videoURL = new URL(moviePlayer.getVideoUrl())
	const videoID = videoURL.searchParams.get('v')
	return videoID
}
