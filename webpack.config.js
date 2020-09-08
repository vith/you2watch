const CopyPlugin = require('copy-webpack-plugin')
const path = require('path')
const pkgDir = require('pkg-dir')
const pkgUp = require('pkg-up')
const WebPackVersionFilePlugin = require('webpack-version-file-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { ProgressPlugin } = require('webpack')

module.exports = {
	mode: 'production',
	devtool: 'inline-source-map',
	// devtool: 'none',
	entry: Object.fromEntries(
		['background', 'contentScript', 'page'].map(entry => [
			entry,
			`./src/entrypoints/${entry}`,
		])
	),
	output: {
		publicPath: 'chrome-extension://ebihioehgamedmkomodfopiiflljphif/',
		path: path.resolve(pkgDir.sync(), 'build', 'unpacked'),
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},
	plugins: [
		new ProgressPlugin(),
		// new CleanWebpackPlugin({
		// 	// TODO: figure out why manifest.json gets removed
		// 	cleanAfterEveryBuildPatterns: ['**/*', '!manifest.json'],
		// 	verbose: true,
		// }),
		new CopyPlugin({
			patterns: [
				{
					from: 'src/static/*.png',
					flatten: true,
				},
			],
		}),
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
