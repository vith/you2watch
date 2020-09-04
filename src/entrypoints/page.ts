import { tenaciouslyMountHeaderUI } from '../components/HeaderUI'
import { PageService } from '../PageService'
import { baseLog } from '../util/logging'

const log = baseLog.extend('page')

main()

async function main() {
	log('injecting you2watch topbar UI')
	const pageService = new PageService()
	await pageService.initialize()
	await tenaciouslyMountHeaderUI()
	log('you2watch loaded')
}
