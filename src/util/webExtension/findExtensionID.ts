import { pageScriptID } from '../../constants'
import { querySelectorOne } from '../dom/querySelectorOne'

export function findExtensionID() {
	const scriptElement = querySelectorOne(document, `script#${pageScriptID}`) as HTMLScriptElement

	const scriptSourceURL = new URL(scriptElement.src)
	const extensionID = scriptSourceURL.host
	return extensionID
}
