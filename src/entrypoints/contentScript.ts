import { pageScriptID } from '../constants'
import { waitForElement } from '../util/dom/waitForElement'
import { YouTooLogger } from '../util/YouTooLogger'

const log = YouTooLogger.extend('contentScript')

async function injectRuntime() {
	const script = document.createElement('script')
	script.src = chrome.runtime.getURL('page.js')
	script.id = pageScriptID

	log('waiting for html')
	const html = await waitForElement(document, 'html')
	log('found html')

	log('waiting for head')
	const head = await waitForElement(html, 'head')
	log('found head')

	log('injecting script')
	head.appendChild(script)
}

injectRuntime()
