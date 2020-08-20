export function unwrapSingleElementArray(maybeArr) {
	if (!(maybeArr instanceof Array)) throw new TypeError('Expected Array')

	if (maybeArr.length !== 1) throw new Error('Expected Array with length 1')

	if (!maybeArr.hasOwnProperty(0))
		throw new Error('Expected array index 0 present')

	return maybeArr[0]
}
