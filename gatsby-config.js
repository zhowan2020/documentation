const path = require('path')

module.exports = {
  siteMetadata: {
    title: 'npm Docs',
    shortName: 'npm',
    description: 'Documentation for the npm registry, website, and command-line interface',
    lang: 'en',
    imageUrl: 'https://user-images.githubusercontent.com/29712634/81721690-e2fb5d80-9445-11ea-8602-4b2294c964f3.png',
  },
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'content',
        path: path.resolve('./content'),
        ignore: ['*.js', '*.yml']
      },
    },
    {
      resolve: 'gatsby-theme-doctornpm',
      options: {
        icon: './static/npm-favicon.png',
        editOnGitHub: true,
        showContributors: false,
        showSidebarEditLink: false,
        repo: {
          url: 'https://github.com/npm/documentation',
          defaultBranch: 'main',
        }
      },
    },
  ],
  pathPrefix: process.env.PATH_PREFIX || '',
}
