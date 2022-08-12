const { Octokit } = require("@octokit/rest");
const npa = require('npm-package-arg');
const path = require('path')
const semver = require('semver')

// A convention that all versions of npm in the package.json
// that will get built for the docs will start with this prefix
const DEP_PREFIX = `npm-v`
const NWO = 'npm/cli'
const URL = '/cli'

// Change this to make a different major version the default
const DEFAULT_MAJOR = 8

const rootPath = (...p) => path.join(
  path.resolve(__dirname, '..', '..'),
  ...p.filter(Boolean)
)

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const fetchFile = (path, ref) => octokit.rest.repos.getContent({
  owner: NWO.split('/')[0],
  repo: NWO.split('/')[1],
  path,
  ref
}).then((r) => Buffer.from(r.data.content, 'base64').toString('utf-8'))

const fetchDefaultBranch = () => octokit.rest.repos.get({
  owner: NWO.split('/')[0],
  repo: NWO.split('/')[1],
}).then(r => r.data.default_branch)

const getNpmVersion = (name) => {
  const main = require.resolve(name)
  const pkg = path.join(main.split(name)[0], name, 'package.json')
  return require(pkg).version
}

async function getReleaseInfo (release) {
  const githubPath = (...p) => path.join('docs', ...p)
  const navPath = githubPath('nav.yml')

  const branch = release.spec.gitCommittish || await fetchDefaultBranch()
  const ref = release.spec.gitCommittish || `v${release.version}`
  
  return {
    ...release,
    branch,
    url: `${URL}/${release.id}`,
    title: `Version ${release.version} (${release.default ? 'Current' : 'Legacy'} release)`,
    nav: await fetchFile(navPath, ref),
    navPath,
    githubPath: (...p) => githubPath('content', ...p),
    contentPath: (...p) => rootPath('node_modules', release.key, 'docs', 'content', ...p),
    outputPath: (...p) => rootPath('content', URL.slice(1), release.id, ...p),
    urlPath: (p) => path.relative(rootPath('content'), p),
  }  
}

function getReleaseDeps () {
  const {dependencies} = require('../package.json')

  return Object.entries(dependencies)
    .filter(([k]) => k.startsWith(DEP_PREFIX))
    .map(([key, spec]) => {
      const version = getNpmVersion(key)
      return {
        key,
        spec,
        version,
        default: semver.major(version) === DEFAULT_MAJOR,
        spec: npa(spec),
        // id gets used as the path portion for each release url
        id: `v${key.replace(DEP_PREFIX, '')}`
      }

    })
}

async function getReleases () {
  // Get all relevant information about the release based on what was installed in this repos
  // package json. Can be installed from the registry or git
  const releases = await Promise.all(getReleaseDeps().map((r) => getReleaseInfo(r)))

  if (!releases.some(r => r.default)) {
    throw new Error([
      'No default release could be found. This could be because none of npm releases installed',
      'in package.json match the default major version configuration.'
    ].join(' '))
  }

  if (new Set(releases.map(r => r.branch)).size !== releases.length) {
    // This requirement is due to the edit links on each page needing to point to a page on GitHub.
    // This requirement could be removed if this script is changed to make those edit links optional
    // for versions that do not live on GitHub anymore.
    throw new Error([
      'Found multiple releases pointing to the same GitHub branch. This could be because',
      'multiple releases were installed from the registry. Only one release can be installed',
      'from the registry, and the rest must be installed from GitHub branches',
    ].join(' '))
  }

  return releases
}

module.exports = {
  getReleases,
  getReleaseDeps,
  CLI_NWO: NWO,
  CLI_URL: URL,
}