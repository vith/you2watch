import { Config } from '../types/Config'

export function asyncChromeStorageSyncGet(fields: (keyof Config)[]): Promise<Config> {
	return new Promise(resolve => {
		chrome.storage.sync.get(fields, resolve)
	})
}
