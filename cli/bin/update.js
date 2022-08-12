const {getReleaseDeps} = require('../lib/releases.js')
const npmFetch = require('npm-registry-fetch')

async function main () {
  const latest = await npmFetch.json('/npm/latest')

  const installSpecs = getReleaseDeps().map((r) => {
    const spec = r.spec.saveSpec || `npm:npm@${latest.version}`
    return `${r.key}@${spec}`
  })

  return installSpecs.join(' ')
}

main().then((s) => process.stdout.write(s))
