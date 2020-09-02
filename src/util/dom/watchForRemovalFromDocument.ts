export function watchForRemovalFromDocument(
	element: Element
): Promise<MutationRecord> {
	return new Promise(resolve => {
		const observer = new MutationObserver((mutations: MutationRecord[]) => {
			for (const mutation of mutations) {
				for (const removedNode of mutation.removedNodes) {
					if (isDescendant(element, removedNode)) {
						observer.disconnect()
						resolve(mutation)
					}
				}
			}
		})

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
