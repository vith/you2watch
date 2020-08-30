export function querySelectorOne(
	searchRoot: ParentNode,
	...selector: Parameters<ParentNode['querySelectorAll']>
) {
	const matches = searchRoot.querySelectorAll(...selector)

	if (matches.length !== 1) {
		throw new Error(`Expected exactly one matching node for selector ${selector}`)
	}

	return matches[0]
}
