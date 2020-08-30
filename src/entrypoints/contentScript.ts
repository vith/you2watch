import { pageScriptID } from '../constants'
import { waitForElement } from '../util/dom/waitForElement'

async function injectRuntime() {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL('page.js')
	script.id = pageScriptID

	trace: 'waiting for html'
	const html = await waitForElement(document, 'html')
	trace: 'found html'

	trace: 'waiting for head'
	const head = await waitForElement(html, 'head')
	trace: 'found head'

	trace: 'injecting script'
	head.appendChild(script)
}

injectRuntime()
