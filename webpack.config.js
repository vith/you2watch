const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	// devtool: 'none',
	entry: Object.fromEntries(
		['background', 'contentScript', 'page'].map(entry => [entry, `./src/entrypoints/${entry}`])
	),
	output: {
		publicPath: 'chrome-extension://mmfgacfcjdhhobbicplipgeablenfego/',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},
	plugins: [
		new CopyPlugin({
			patterns: [{ from: 'src/static' }],
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
