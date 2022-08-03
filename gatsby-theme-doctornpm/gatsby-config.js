const path = require('path')

module.exports = themeOptions => {
  return {
    plugins: [
      'gatsby-plugin-styled-components',
      'gatsby-plugin-react-helmet',
      'gatsby-plugin-remove-trailing-slashes',
      'gatsby-plugin-catch-links',
      'gatsby-plugin-meta-redirect',
      {
        resolve: 'gatsby-plugin-mdx',
        options: {
          extensions: ['.mdx', '.md'],
          defaultLayouts: {
            default: require.resolve('./src/components/layout.js'),
          },
        },
      },
      {
        resolve: 'gatsby-plugin-manifest',
        options: {
          icon: path.resolve(themeOptions.icon)
        },
      },
    ],
  }
}
