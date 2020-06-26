export function hookMethod(object, methodName, callback) {
	const origFn = object[methodName]
	object[methodName] = (...args) => {
		return callback(object, origFn, ...args)
	}
}
