import { querySelectorOne } from './querySelectorOne'

export async function waitForElement(searchRoot: ParentNode, selector: string): Promise<Element> {
	console.assert(searchRoot instanceof Node)

	const matches = [...searchRoot.querySelectorAll(selector)]

	if (matches.length === 1) {
		return matches[0]
	}

	if (matches.length > 1) {
		throw new Error('Multiple matching elements found for selector')
	}

	return new Promise(resolve => {
		// const onMutation = (mutationsList: MutationRecord[], observer: MutationObserver) => {
		// 	const mutatedNodes = getMutatedNodes(mutationsList)

		// 	for (const mutatedNode of mutatedNodes) {
		// 		if (mutatedNode.querySelectorAll) {
		// 			const testMatches = [...mutatedNode.querySelectorAll(selector)]
		// 			if (testMatches.length > 0) {
		// 				console.debug('fuck', { mutatedNode, mutationsList })
		// 			}
		// 		}
		// 		/* if (mutatedNode.id === 'info' || true) {
		// 			// const matches = mutatedNode.matches(selector)
		// 			const { parentNode } = mutatedNode
		// 			const parentId = parentNode.id

		// 			const parentMatches = parentNode.matches('#primary-inner')
		// 			const childBasicMatch = mutatedNode.matches('#info')
		// 			const childStrictMatch = mutatedNode.matches('#primary-inner > #info')
		// 			const childRelaxedMatch = mutatedNode.matches('#primary-inner #info')

		// 			console.debug('onMutation', {
		// 				mutationsList,
		// 				mutatedNode,
		// 				selector,
		// 				matches: {
		// 					parentMatches,
		// 					childBasicMatch,
		// 					childStrictMatch,
		// 					childRelaxedMatch,
		// 					matchesSelector: mutatedNode.matches(selector),
		// 				},
		// 				parentNode,
		// 				parentId,
		// 				isElement: mutatedNode instanceof Element,
		// 				condition: mutatedNode instanceof Element && mutatedNode.matches(selector),
		// 			})
		// 		} */

		// 		if (
		// 			mutatedNode instanceof Element /* text nodes don't have .matches method */ &&
		// 			mutatedNode.matches(selector)
		// 		) {
		// 			console.debug('resolving with match', mutatedNode)
		// 			resolve(mutatedNode)
		// 			observer.disconnect()
		// 			return
		// 		}
		// 	}
		// }

		const onMutation = (mutationsList: MutationRecord[], observer: MutationObserver) => {
			for (const mutationRecord of mutationsList) {
				switch (mutationRecord.type) {
					case 'childList':
						const match = querySelectorOne(mutationRecord.target, selector)
						if (match) {
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
