// require modules
import archiver from 'archiver'
import execa from 'execa'
import filenamify from 'filenamify'
import fs from 'fs'
import path from 'path'
import pkgDir from 'pkg-dir'
import prettyBytes from 'pretty-bytes'
import prettyMs from 'pretty-ms'

const startTime = Date.now()

packExtensionZip()

function packExtensionZip() {
	const version = ver()
	const filename = `youtoo-${version}.zip`
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
		version = `${version}-${new Date(startTime).toISOString()}`
	}

	return filenamify(version)
}
