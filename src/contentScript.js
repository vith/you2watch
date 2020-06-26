// inject page script
const script = document.createElement('script')
script.src = chrome.runtime.getURL('injectedRuntime.js')
document.head.appendChild(script)
