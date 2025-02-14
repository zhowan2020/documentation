#!/usr/bin/env node
// cli_import: include the npm cli documentation into the main docs
// 
// This script will:
// 1. Read the `releases.json` file to understand which versions of the
//    CLI should be updated.  The `releases.json` should contain an array
//    of versions, each with the following information:
//
//    `id`: A short identifier for the version, eg `v6` or `v7`.  This
//          will be used as the input folder for the documentation; an
//          instance of the CLI should reside at that path beneath the
//          `cli` directory.  (Submodules are a good idea here.)  It
//          will also be used as the output folder in the main content.
//    `version`: The full major semantic version number (eg `6.0.0`).
//          This will be used in examples in the documentation.
//    `title`: A long description of the version information.  This will
//          be used in the version picker,.
//    `branch`: The branch name for the version.
//
// 2. Read each directory specified in the `releases.json`.  The data in
//    `docs/content` will be read.  Each file will be translated in order
//    to add `redirects` (as `redirect_from` frontmatter).  Index pages
//    will be created for each section of the CLI documentation.  Finally,
//    metadata will be added so that the gatsby theme knows the GitHub
//    repository information for the content.
//
// 3. The CLI's navigation (in `docs/nav.yml`) will be added to the
//    main site's base navigation (in `../src/nav-base.yml`) to produce
//    the resulting gatsby / doctornpm navigation (in
//    `../src/gatsby-theme-doctornpm/nav.yml`).

const fs = require('fs');
const path = require('path');
const releases = require('./releases.json');
const yaml = require('yaml');

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


module.exports = () => {
    const variants = []
    const pages = []

    for (const release of releases) {
        const res = buildCliVersion(release)
        variants.push(res.nav)
        pages.push(...res.pages)
    }

    return {
        nav: [{
            "title": cliTitle,
            "shortName": "CLI",
            "url": cliUrl,
            "variants": variants
        }],
        pages: pages
    }
}

function buildCliVersion(version)  {
    const navInputFile = fs.readFileSync(path.join(inputPath, version.id, cliNavFile), 'utf8');
    const children = rewriteUrls(version, yaml.parse(navInputFile));
    const navForVersion = {
        title: version.title,
        shortName: version.id,
        url: `${cliUrl}/${version.id}`,
        default: version.default ? true : false,
        children,
    };
    return {
        pages: copyDocs(version, navForVersion),
        nav: navForVersion
    }
}

function rewriteUrls(version, nodes) {
    nodes.forEach((n) => {
        const path = n.url.startsWith('/') ? n.url.substring(1) : n.url;
        const data = translate(version, { path: path });

        n.url = `${cliUrl}/${version.id}/${data.path}`;

        if (n.children) {
            rewriteUrls(version, n.children);
        }
    });
    return nodes
}

function translate(version, data, navForVersion) {
    if (!data.frontmatter) {
        data.frontmatter = { };
    }

    if (!data.frontmatter.redirect_from) {
        data.frontmatter.redirect_from = [ ];
    }

    let matches;

    if ((matches = data.path.match(/(?:(^|.*?)\/?)index(?:\.md(?:x)?)$/))) {
        if (version.default) {
            const [, section] = matches;

            data.frontmatter.redirect_from = section ? [
                `${section}`,
                `/cli/${section}`,
            ] : [
                `/cli`,
            ]
        }
    }

    else if (data.path.match(/^commands\/npm(?:\.md(?:x)?)?$/)) {
        if (version.default) {
            data.frontmatter.redirect_from = [
                `/cli/npm`,
                `/cli/npm.html`,
                `/cli/commands/npm`,
                `/cli-commands/npm`,
                `/cli-commands/npm.html`,
            ];
        }
    }

    else if ((matches = data.path.match(/^commands\/npm-(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, command] = matches;

        if (version.default) {
            data.frontmatter.redirect_from = [
                `/cli/${command}`,
                `/cli/${command}.html`,
                `/cli/commands/${command}`,
                `/cli-commands/${command}`,
                `/cli-commands/${command}.html`,
                `/cli-commands/npm-${command}`,
            ];
        }
    }

    else if ((matches = data.path.match(/^(configuring-npm)\/(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, path, page] = matches;

        if (version.default) {
            data.frontmatter.redirect_from = [
                `/${path}/${page}`,
                `/${path}/${page}.html`,
            ];
        }
    }

    else if ((matches = data.path.match(/^(using-npm)\/(.*?)(?:\.md(?:x)?)?$/)) != null) {
        const [, path, page] = matches;

        if (version.default) {
            data.frontmatter.redirect_from = [
                `/${path}/${page}`,
                `/${path}/${page}.html`,
                `/misc/${page}`,
                `/misc/${page}.html`,
            ];
        }
    }

    data.frontmatter.github_repo = githubRepo;
    data.frontmatter.github_branch = version.branch;
    data.frontmatter.github_path = `${cliContentPath}/${data.path}`;

    if (redirects[data.path] && version.default) {
        data.frontmatter.redirect_from.push(...redirects[data.path]);
    }
    
    if ((matches = data.path.match(/(?:(^|.*?)\/?)index(?:\.md(?:x)?)$/)) != null && !data.mdx) {
        // For virtual index pages (meaning they dont come from the cli
        // repo), we get the title from the nav section with a matching url.
        // Also point the edit link to the nav file, in case there are
        // typos or something to fix there.
        const [, section] = matches;

        data.frontmatter.title = section
            ? navForVersion.children.find((c) => path.basename(c.url) === section).title
            : cliTitle;
        data.frontmatter.github_path = cliNavFile;
        data.mdx = '\n<Index depth="1" />\n';
    }

    if (data.mdx) {
        const replacer = (_, p1, p2) => `[${p1}](/cli/${version.id}/${p2})`;

        data.mdx = data.mdx.replace(/@VERSION@/g, version.version)
            .replace(/\[([^\]]+)\]\(\/(commands\/[^)]+)\)/g, replacer)
            .replace(/\[([^\]]+)\]\(\/(configuring-npm\/[^)]+)\)/g, replacer)
            .replace(/\[([^\]]+)\]\(\/(using-npm\/[^)]+)\)/g, replacer);
    }

    if (data?.frontmatter?.redirect_from?.length === 0) {
        delete data.frontmatter.redirect_from
    }

    return data;
}

function copyDocs(version, navForVersion, relativedir) {
    const contentRoot = path.join(inputPath, version.id, cliContentPath);
    const dirPath = relativedir ? path.join(contentRoot, relativedir) : contentRoot;

    let paths = [ ]

    const children = fs.readdirSync(dirPath);

    if (!children.includes("index.md") && !children.includes("index.mdx")) {
        children.push("index.mdx");
    }

    children.forEach((fn) => {
        const relativechild = relativedir ? path.join(relativedir, fn) : fn;
        const childpath = path.join(contentRoot, relativechild);
        const exists = fs.existsSync(childpath);

        if (exists && fs.lstatSync(childpath).isDirectory()) {
            const childpaths = copyDocs(version, navForVersion, relativechild);
            paths = paths.concat(childpaths);
        }
        else {
            const contents = exists ? fs.readFileSync(childpath).toString() : null;
            const components = contents ? contents.match(/^---\n(.*)\n---\n(.*)/s) : null;
            let output;

            let filedata = {
                path: relativechild,
                contents: contents,
                frontmatter: components ? yaml.parse(components[1]) : null,
                mdx: components ? components[2] : null
            };

            filedata = translate(version, filedata, navForVersion);

            if (filedata) {
                output = "---\n" + yaml.stringify(filedata.frontmatter) + "---\n" + filedata.mdx;
            } else {
                output = contents;
            }

            const filePath = path.join('cli', version.id, filedata.path);

            paths.push({
                path: filePath,
                contents: output,
            })
        }
    });

    return paths;
}
