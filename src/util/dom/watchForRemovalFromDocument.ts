import { baseLog } from '../logging'

const log = baseLog.extend(watchForRemovalFromDocument.name)

export function watchForRemovalFromDocument(
	element: Element
): Promise<MutationRecord> {
	return new Promise((resolve, reject) => {
		// check if element was removed before we started observing
		if (!isDescendant(element, document)) {
			const err = new NotDescendantOfDocumentError(element)
			log(err)
			reject(err)
			return
		}

		const observer = new MutationObserver((mutations: MutationRecord[]) => {
			for (const mutation of mutations) {
				for (const removedNode of mutation.removedNodes) {
					if (
						element === removedNode ||
						isDescendant(element, removedNode)
					) {
						log('watched node detached from document', element)
						observer.disconnect()
						resolve(mutation)
					}
				}
			}
		})

		log('beginning watch for element removal from document tree', element)

		observer.observe(document, {
			childList: true,
			subtree: true,
		})
	})
}

function isDescendant(descendant: Node, possibleAncestor: Node): boolean {
	const parent = descendant.parentNode
	if (possibleAncestor === parent) {
		return true
	} else if (parent) {
		return isDescendant(parent, possibleAncestor)
	} else {
		return false
	}
}

class NotDescendantOfDocumentError extends Error {
	element: Element

	constructor(element: Element) {
		super()

		// @ts-expect-error Error.captureStackTrace is V8-only
		if (Error.captureStackTrace) {
			// @ts-expect-error Error.captureStackTrace is V8-only
			Error.captureStackTrace(this, NotDescendantOfDocumentError)
		}

		this.name = 'NotDescendantOfDocumentError'
		this.message = 'element was removed before observation began!'
		this.element = element
	}
}
