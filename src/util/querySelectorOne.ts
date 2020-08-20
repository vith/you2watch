export function querySelectorOne(
	baseElm: ParentNode,
	...query: Parameters<ParentNode['querySelectorAll']>
) {
	const matches = baseElm.querySelectorAll(...query)

	if (matches.length > 1) {
		throw new Error('Expected at most one matching node for selector')
	}

	return matches[0]
}
