const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: Object.fromEntries(
		['background', 'contentScript', 'injectedRuntime'].map((entry) => [
			entry,
			`./src/${entry}`,
		])
	),
	plugins: [
		new CopyPlugin({
			patterns: [{ from: 'src/static' }],
		}),
	],
}
