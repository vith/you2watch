type StringKeyedPOJO = {
	[key: string]: any
}

export function mergeDefaults(
	target: StringKeyedPOJO,
	defaults: StringKeyedPOJO
) {
	const presentKeys = Object.keys(target)
	for (const defaultKey in Object.keys(defaults)) {
		if (!presentKeys.includes(defaultKey)) {
			target[defaultKey] = defaults[defaultKey]
		}
	}
}

export function missingProperties<T_Source extends Record<string, any>>(
	partialObject: Partial<T_Source>,
	sourceObject: T_Source
) {
	const missing: Partial<T_Source> = {}
	const presentList: (keyof T_Source)[] = Object.keys(partialObject)
	const presentSet = new Set(presentList)
	const sourceKeys: (keyof T_Source)[] = Object.keys(sourceObject)
	for (const key of sourceKeys) {
		if (!presentSet.has(key)) {
			missing[key] = sourceObject[key]
		}
	}
	return missing
}
