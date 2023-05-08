import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>An Archive of our Trends</span>,
  project: {
    link: 'https://github.com/evenius/an-archive-of-our-trends',
  },
  search: {
    component: () => null,
  },
  docsRepositoryBase: 'https://github.com/evenius/an-archive-of-our-trends',
  footer: {
    text: 'Nextra Docs Template',
  },
  toc: {
    title: "Table of Contents",
    extraContent: null,
  },
  editLink: {
    component: () => null,
  },
  feedback: {
    content: null
  }
}

export default config
