import archiver from 'archiver'
import execa from 'execa'
import filenamify from 'filenamify'
import fs from 'fs'
import path from 'path'
import pkgDir from 'pkg-dir'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'
import readPkg from 'read-pkg'
import yargs from 'yargs'

const pkg = readPkg.sync()

yargs
	.command('pack', 'create build zip', {}, packExtensionZip)
	.command('version', 'print version string', {}, () => console.log(ver()))
	.command(
		'ci-export-version',
		'exports the version string to the github actions environment',
		{},
		() => console.log(`::set-env name=_BUILD_VERSION::${ver()}`)
	)
	.demandCommand()
	.help().argv

function packExtensionZip() {
	const startTime = Date.now()
	const filename = `${pkg.name}-${ver()}.zip`
	const pkgRoot = pkgDir.sync()
	const outputPath = path.join(pkgRoot, 'build', filename)

	const outputStream = fs.createWriteStream(outputPath)
	const archive = archiver('zip', {
		zlib: { level: 9 },
	})

	outputStream.on('close', () => {
		const finishTime = Date.now()
		const elapsed = prettyMs(finishTime - startTime)
		const outputPathRelative = path.relative(pkgRoot, outputPath)
		console.log(
			`wrote ${prettyBytes(
				archive.pointer()
			)} bytes to ${outputPathRelative} in ${elapsed}`
		)
	})
	outputStream.on('end', () => console.log('Data has been drained'))
	archive.on('warning', err => {
		throw err
	})
	archive.on('error', err => {
		throw err
	})
	archive.pipe(outputStream)
	archive.directory(path.join(pkgRoot, 'build', 'unpacked'), false)
	archive.finalize()
}

function ver() {
	let version = execa.commandSync(
		'git describe --long --tags --dirty --always'
	).stdout

	if (version.endsWith('-dirty')) {
		const timestamp = new Date().toISOString()
		version = `${version}-${timestamp}`
	}

	return filenamify(version)
}
