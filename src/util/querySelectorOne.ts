export function querySelectorOne(baseElm, query) {
	const matches = baseElm.querySelectorAll(query)
	if (matches.length > 1) {
		throw new Error('Expected at most one matching node for selector')
	}
	return matches[0]
}
