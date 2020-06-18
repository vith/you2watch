function querySelectorOne(baseElm, query) {
	const matches = baseElm.querySelectorAll(query)
	if (matches.length !== 1) {
		throw new Exception('Expected exactly one matching node for selector')
	}
	return matches[0]
}

const moviePlayer = querySelectorOne(document, '#movie_player')
const videoElm = querySelectorOne(moviePlayer, 'video')

function debugEvent(eventName, emitter, collector) {
	emitter.addEventListener(eventName, (...eventArgs) => {
		eventArgs = unwrapSingleElementArray(eventArgs)
		let details = { emitter, eventName, eventArgs }

		if (collector) {
			const collected = collector(details)
			details = { ...details, collected }
		}

		console.log('event debug', details)
	})
}

function unwrapSingleElementArray(maybeArr) {
	if (!(maybeArr instanceof Array))
		return maybeArr

	if (maybeArr.length !== 1)
		return maybeArr

	if (!maybeArr.hasOwnProperty(0))
		return maybeArr

	return maybeArr[0]
}

debugEvent('seeking', videoElm, ({ emitter }) => {
	const currentTime = emitter.getCurrentTime()
	return { currentTime }
})

debugEvent('seeked', videoElm)
