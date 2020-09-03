import { YouTooLogger } from '../YouTooLogger'
import { assertParentNode } from './assertParentNode'
import { querySelectorOne } from './querySelectorOne'

const log = YouTooLogger.extend(waitForElement.name)

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
		const onMutation = (
			mutationsList: MutationRecord[],
			observer: MutationObserver
		) => {
			for (const mutationRecord of mutationsList) {
				switch (mutationRecord.type) {
					case 'childList':
						try {
							const match = querySelectorOne(
								assertParentNode(mutationRecord.target),
								selector
							)

							log('found', { match, mutationRecord, selector })
							resolve(match)
							observer.disconnect()
							return
						} catch (e) {
							// log('no match', { mutationRecord, selector, e })
						}
						break

					case 'attributes':
						// mutatedNodes.push(mutationRecord.target)
						break
					default:
						throw new Error(
							`Unhandled MutationRecord.type: ${mutationRecord.type}`
						)
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
		log('observing changes', {
			searchRoot,
			selector,
			observerOptions,
			mutationObserver,
		})
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
				throw new Error(
					`Unhandled MutationRecord.type: ${mutationRecord.type}`
				)
		}
	}
	return mutatedNodes
}
