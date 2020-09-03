import { YouTooApp } from '../components/YouTooApp'
import { mountHeaderButton } from '../components/YouTubeHeaderButton'
import { YouTooLogger } from '../util/YouTooLogger'

const log = YouTooLogger.extend('page')

main()

async function main() {
	log('injecting YouToo topbar UI')

	const youTooApp = new YouTooApp()

	await youTooApp.initialize()

	await mountHeaderButton()

	log('YouToo loaded')
}
