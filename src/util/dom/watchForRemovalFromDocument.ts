import { baseLog } from '../logging'

const log = baseLog.extend(watchForRemovalFromDocument.name)

export function watchForRemovalFromDocument(
	element: Element
): Promise<MutationRecord> {
	return new Promise(resolve => {
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
