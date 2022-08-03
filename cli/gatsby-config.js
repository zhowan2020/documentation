const path = require('path')

module.exports = {
  plugins: [
    ...require('./releases.json').map((release) => ({
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `cli-${release.id}`,
        path: path.resolve(__dirname, release.id, 'docs', 'content'),
      },
    })),
  ]
}
