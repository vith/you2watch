import { YouTooApp } from '../components/YouTooApp'
import { mountHeaderButton } from '../components/YouTubeHeaderButton'

main()

async function main() {
	trace: 'injecting YouToo topbar UI'

	const youTooApp = new YouTooApp()

	await youTooApp.initialize()

	await mountHeaderButton()

	trace: 'YouToo loaded'
}
