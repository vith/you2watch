export function assertParentNode(node: Node): ParentNode {
	// https://developer.mozilla.org/en-US/docs/Web/API/ParentNode
	const parentNodeImplementers = [Element, Document, DocumentFragment]
	for (const impl of parentNodeImplementers) {
		if (node instanceof impl) return node as ParentNode
	}
	throw new TypeError('Expected instance of ParentNode')
}
