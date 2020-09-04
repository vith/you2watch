const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const WebPackVersionFilePlugin = require('webpack-version-file-plugin')
const pkgDir = require('pkg-dir')
const pkgUp = require('pkg-up')

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	// devtool: 'none',
	entry: Object.fromEntries(
		['background', 'contentScript', 'page'].map(entry => [
			entry,
			`./src/entrypoints/${entry}`,
		])
	),
	output: {
		publicPath: 'chrome-extension://mmfgacfcjdhhobbicplipgeablenfego/',
		path: path.resolve(__dirname, 'build/unpacked'),
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},
	plugins: [
		/* new CopyPlugin({
			patterns: [{ from: 'src/static' }],
		}), */
		new WebPackVersionFilePlugin({
			packageFile: path.join(pkgUp.sync()),
			outputFile: path.join(
				pkgDir.sync(),
				'build',
				'unpacked',
				'manifest.json'
			),
			template: path.join(
				pkgDir.sync(),
				'src',
				'static',
				'manifest.json'
			),
		}),
	],
	module: {
		rules: [
			{
				test: /\.(mj|j|t)sx?$/i,
				exclude: /node_modules/,
				use: 'babel-loader',
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				loader: 'file-loader',
				options: {
					outputPath: 'images',
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				loader: 'file-loader',
				options: {
					outputPath: 'fonts',
				},
			},
		],
	},
}
