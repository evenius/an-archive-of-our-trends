
// next.config.js
const isProd = process.env.NODE_ENV === 'production'

const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
})

module.exports = withNextra({
  output: 'export',
  distDir: 'docs',
  assetPrefix: isProd ? '//an-archive-of-our-trends/' : '',
  images: {
    unoptimized: true,
  },
})