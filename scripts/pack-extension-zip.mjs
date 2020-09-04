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
	const filename = filenamify(`youtoo-${version}.zip`, { replacement: '_' })
	const pkgRoot = pkgDir.sync()
	const outputPath = path.join(pkgRoot, 'build', filename)

	const output = fs.createWriteStream(outputPath)
	const archive = archiver('zip', {
		zlib: { level: 9 },
	})

	output.on('close', () => {
		const finishTime = Date.now()
		const elapsed = prettyMs(finishTime - startTime)
		const outputPathRelative = path.relative(pkgRoot, outputPath)
		console.log(
			`wrote ${prettyBytes(
				archive.pointer()
			)} bytes to ${outputPathRelative} in ${elapsed}`
		)
	})
	output.on('end', () => console.log('Data has been drained'))
	archive.on('warning', err => {
		throw err
	})
	archive.on('error', err => {
		throw err
	})
	archive.pipe(output)
	archive.directory(path.join(pkgRoot, 'build', 'unpacked'), false)
	archive.finalize()
}

function ver() {
	// git describe --long --tags | sed 's/\([^-]*-g\)/r\1/;s/-/./g'
	/* ( set -o pipefail
		git describe --long 2>/dev/null | sed 's/\([^-]*-g\)/r\1/;s/-/./g' ||
		printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
	) */

	return (
		baseVersion() +
		(isDirty() ? `-dirty-${new Date(startTime).toISOString()}` : '')
	)
}

function baseVersion() {
	try {
		return tagRelativeGitVersion()
			.replace(/\([^-]*-g\)/, 'r$1')
			.replace(/-/g, '.')
	} catch (err) {
		return `r${gitRevisionCount()}.${latestCommitHash()}`
	}
}

function latestCommitHash() {
	return execa.commandSync('git rev-parse --short HEAD').stdout
}

function gitRevisionCount() {
	return execa.commandSync('git rev-list --count HEAD').stdout
}

function tagRelativeGitVersion() {
	return execa.commandSync('git describe --long --tags').stdout
}

function isDirty() {
	return getStatusPorcelain().length > 0
}

function getStatusPorcelain() {
	return execa.commandSync('git status --porcelain').stdout
}
