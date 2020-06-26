import { unwrapSingleElementArray } from './array'

export function debugEvent(eventName, emitter, collector) {
	emitter.addEventListener(eventName, (...eventArgs) => {
		eventArgs = unwrapSingleElementArray(eventArgs)
		let details = { emitter, eventName, eventArgs }

		if (collector) {
			const collected = collector(details)
			details = { ...details, collected }
		}

		console.log(eventName, details)
	})
}
