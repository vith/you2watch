import { tenaciouslyMountHeaderUI } from '../components/YouTubeHeaderUI'
import { YouTooLogger } from '../util/YouTooLogger'
import { YouTooApp } from '../YouTooApp'

const log = YouTooLogger.extend('page')

main()

async function main() {
	log('injecting YouToo topbar UI')
	const youTooApp = new YouTooApp()
	await youTooApp.initialize()
	await tenaciouslyMountHeaderUI()
	log('YouToo loaded')
}
