import { waitForElement } from './util/wait-for-element'

// inject page script
async function contentScript() {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL('injectedRuntime.js')

	trace: 'waiting for html'
	const html = await waitForElement(document, 'html')
	trace: 'found html'

	trace: 'waiting for head'
	const head = await waitForElement(html, 'head')
	trace: 'found head'

	trace: 'injecting script'
	head.appendChild(script)
}

contentScript()
