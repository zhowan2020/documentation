const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const releases = require('./releases.json');

const docsPath = path.dirname(__dirname);
const inputPath = path.join(docsPath, 'cli');
const cliNavFile = path.join('docs', 'nav.yml');
const cliContentPath = path.join('docs', 'content');

const githubRepo = 'npm/cli';
const cliTitle = 'npm CLI';
const cliUrl = '/cli';

const redirects = {
    'index.mdx': [
        '/cli-documentation',
    ],
    'commands/index.mdx': [
        '/cli-documentation/cli',
        '/cli-documentation/cli-commands'
    ],
    'commands/npm-access.md': [
        '/cli-documentation/access',
    ],
    'commands/npm-install.md': [
        '/cli-documentation/install',
    ],
    'configuring-npm/index.mdx': [
        '/cli-documentation/configuring-npm',
        '/cli-documentation/files',
    ],
    'configuring-npm/folders.md': [
        '/files/folders',
        '/files/folders.html',
    ],
    'configuring-npm/npmrc.md': [
        '/cli-documentation/files/npmrc',
        '/files/npmrc',
        '/files/npmrc.html'
    ],
    'configuring-npm/package-json.md': [
        '/configuring-npm/package.json',
        '/creating-a-packge-json-file',
        '/files/package.json',
        '/files/package.json.html',
    ],
    'configuring-npm/package-lock-json.md': [
        '/files/package-lock.json',
        '/files/package-lock.json.html',
    ],
    'configuring-npm/package-locks.md': [
        '/files/package-locks',
        '/files/package-locks.html',
    ],
    'configuring-npm/shrinkwrap-json.md': [
        '/files/shrinkwrap.json',
        '/files/shrinkwrap.json.html',
    ],
    'using-npm/index.mdx': [
        '/cli-documentation/misc',
        '/cli-documentation/using-npm',
        '/misc/index.html',
    ],
    'using-npm/removal.md': [
        '/misc/removing-npm',
        '/misc/removing-npm.html',
    ],
    'using-npm/scope.md': [
        '/using-npm/npm-scope',
    ],
};

module.exports = {
    buildNav,
    transformPage,
}

function buildNav () {
    const variants = releases.map(buildVersionNav)
    return {
        "title": cliTitle,
        "shortName": "CLI",
        "url": cliUrl,
        "variants": variants
    }
}

function buildVersionNav(version) {
    const navInputFile = fs.readFileSync(path.join(inputPath, version.id, cliNavFile), 'utf8');
    const children = rewriteUrls(version, yaml.parse(navInputFile));
    return {
        title: version.title,
        shortName: version.id,
        url: `${cliUrl}/${version.id}`,
        default: version.default ? true : false,
        children,
    };
}


function rewriteUrls(version, nodes) {
    nodes.forEach((n) => {
        n.url = `${cliUrl}/${version.id}/${n.url.substring(1)}`;
        if (n.children) {
            rewriteUrls(version, n.children);
        }
    });
    return nodes
}

// function createIndex(nodePath) {
//     if ((matches = nodePath.match(/(?:(^|.*?)\/?)index(?:\.md(?:x)?)$/)) != null && !data.mdx) {
//         // For virtual index pages (meaning they dont come from the cli
//         // repo), we get the title from the nav section with a matching url.
//         // Also point the edit link to the nav file, in case there are
//         // typos or something to fix there.
//         const [, section] = matches;

//         result.title = section
//             ? navItems.find((c) => path.basename(c.url) === section).title
//             : cliTitle;
//         result.github_path = cliNavFile;
//         data.mdx = '\n<Index depth="1" />\n';
//     }

//     return {
        
//     }
// }

function transformPage({ releaseId, data }) {
    const version = releases.find((r) => r.id === releaseId)
    return updateFrontmatter(version, data, buildVersionNav(version).children)
}

function updateFrontmatter(version, { content, path: nodePath }) {
    let matches;

    const result = {}

    if ((matches = nodePath.match(/(?:(^|.*?)\/?)index(?:\.md(?:x)?)$/))) {
        if (version.default) {
            const [, section] = matches;

            result.redirect_from = section ? [
                `${section}`,
                `/cli/${section}`,
            ] : [
                `/cli`,
            ]
        }
    }

    else if (nodePath.match(/^commands\/npm(?:\.md(?:x)?)?$/)) {
        if (version.default) {
            result.redirect_from = [
                `/cli/npm`,
                `/cli/npm.html`,
                `/cli/commands/npm`,
                `/cli-commands/npm`,
                `/cli-commands/npm.html`,
            ];
        }
    }

    else if ((matches = nodePath.match(/^commands\/npm-(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, command] = matches;

        if (version.default) {
            result.redirect_from = [
                `/cli/${command}`,
                `/cli/${command}.html`,
                `/cli/commands/${command}`,
                `/cli-commands/${command}`,
                `/cli-commands/${command}.html`,
                `/cli-commands/npm-${command}`,
            ];
        }
    }

    else if ((matches = nodePath.match(/^(configuring-npm)\/(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, path, page] = matches;

        if (version.default) {
            result.redirect_from = [
                `/${path}/${page}`,
                `/${path}/${page}.html`,
            ];
        }
    }

    else if ((matches = nodePath.match(/^(using-npm)\/(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, path, page] = matches;

        if (version.default) {
            result.redirect_from = [
                `/${path}/${page}`,
                `/${path}/${page}.html`,
                `/misc/${page}`,
                `/misc/${page}.html`,
            ];
        }
    }

    result.github_repo = githubRepo;
    result.github_branch = version.branch;
    result.github_path = `${cliContentPath}/${nodePath}`;

    if (redirects[nodePath] && version.default) {
        if (!result.redirect_from) {
            result.redirect_from = []
        }
        result.redirect_from.push(...redirects[nodePath]);
    }
    
    if (content) {
        const replacer = (_, p1, p2) => `[${p1}](/cli/${version.id}/${p2})`;

        result.content = content.replace(/@VERSION@/g, version.version)
            .replace(/\[([^\]]+)\]\(\/(commands\/[^)]+)\)/g, replacer)
            .replace(/\[([^\]]+)\]\(\/(configuring-npm\/[^)]+)\)/g, replacer)
            .replace(/\[([^\]]+)\]\(\/(using-npm\/[^)]+)\)/g, replacer);
    }

    return result; 
}

