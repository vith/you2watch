export function extractVideoID(senderURL) {
	const url = new URL(senderURL)
	if (url.origin !== 'https://www.youtube.com' || url.pathname !== '/watch') {
		throw new Error('Invalid message origin')
	}

	if (!url.searchParams.has('v')) {
		throw new Error('No videoID')
	}

	return url.searchParams.get('v')
}
