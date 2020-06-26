import copy from 'rollup-plugin-copy'
import del from 'rollup-plugin-delete'
import pluginMultiInput from 'rollup-plugin-multi-input'
const multiInput = pluginMultiInput.default

export default {
	input: [
		'./src/injectedRuntime.js',
		'./src/contentScript.js',
		'./src/background.js',
	],
	output: {
		dir: 'dist',
		format: 'es',
	},
	plugins: [
		del({ targets: 'dist/*' }),
		multiInput(),
		copy({
			targets: [{ src: 'src/manifest.json', dest: 'dist' }],
		}),
	],
}
