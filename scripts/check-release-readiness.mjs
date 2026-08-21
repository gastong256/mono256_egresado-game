import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const stableVersionPattern = /^([1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u

export function isStablePatchedNextVersion(version) {
  const match = stableVersionPattern.exec(version)
  if (!match) {
    return false
  }

  const [, majorText = '0', minorText = '0', patchText = '0'] = match
  const major = Number(majorText)
  const minor = Number(minorText)
  const patch = Number(patchText)

  return (
    major > 16 || (major === 16 && (minor > 3 || (minor === 3 && patch >= 2)))
  )
}

export async function checkReleaseReadiness() {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  )
  const nextVersion = packageJson.dependencies?.next

  if (typeof nextVersion !== 'string') {
    throw new Error('Next.js must be pinned before checking release readiness')
  }
  if (!stableVersionPattern.test(nextVersion)) {
    throw new Error(
      `Public release blocked: Next.js must be an exact stable x.y.z version; received ${nextVersion}.`,
    )
  }
  if (!isStablePatchedNextVersion(nextVersion)) {
    throw new Error(
      `Public release blocked: Next.js ${nextVersion} predates the announced 16.3.2 security patch. Upgrade, regenerate the lockfile and run pnpm verify.`,
    )
  }

  process.stdout.write(
    `Release dependency gate passed with Next.js ${nextVersion}\n`,
  )
}

const entryPoint = process.argv[1]
if (entryPoint && import.meta.url === pathToFileURL(resolve(entryPoint)).href) {
  await checkReleaseReadiness()
}
