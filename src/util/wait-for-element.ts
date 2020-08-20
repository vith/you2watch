import { assertParentNode } from './assertParentNode'
import { querySelectorOne } from './querySelectorOne'

export async function waitForElement(
	searchRoot: Node & ParentNode,
	selector: string
): Promise<Element> {
	const matches = [...searchRoot.querySelectorAll(selector)]

	if (matches.length === 1) {
		return matches[0]
	}

	if (matches.length > 1) {
		throw new Error('Multiple matching elements found for selector')
	}

	return new Promise(resolve => {
		const onMutation = (mutationsList: MutationRecord[], observer: MutationObserver) => {
			for (const mutationRecord of mutationsList) {
				switch (mutationRecord.type) {
					case 'childList':
						const match = querySelectorOne(
							assertParentNode(mutationRecord.target),
							selector
						)
						if (match) {
							// @ts-expect-error
							trace: 'found', { match, mutationRecord, selector }
							resolve(match)
							observer.disconnect()
							return
						}
						break
					case 'attributes':
						// mutatedNodes.push(mutationRecord.target)
						break
					default:
						throw new Error(`Unhandled MutationRecord.type: ${mutationRecord.type}`)
				}
			}
		}

		const observerOptions = {
			childList: true,
			attributes: true,
			subtree: true,
		}

		const mutationObserver = new MutationObserver(onMutation)
		mutationObserver.observe(searchRoot, observerOptions)
		// @ts-expect-error
		trace: 'observing changes',
			{
				searchRoot,
				selector,
				observerOptions,
				mutationObserver,
			}
	})
}

function getMutatedNodes(mutationsList: MutationRecord[]): Node[] {
	const mutatedNodes = []
	for (const mutationRecord of mutationsList) {
		switch (mutationRecord.type) {
			case 'childList':
				mutatedNodes.push(...mutationRecord.addedNodes)
				break
			case 'attributes':
				mutatedNodes.push(mutationRecord.target)
				break
			default:
				throw new Error(`Unhandled MutationRecord.type: ${mutationRecord.type}`)
		}
	}
	return mutatedNodes
}
