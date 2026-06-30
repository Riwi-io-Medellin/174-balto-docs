// @ts-check
const { themes } = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Balto',
  tagline: 'Professional dog-walking — tracked in real time',
  favicon: 'img/favicon.ico',

  url: 'https://balto-docs.vercel.app',
  baseUrl: '/',

  organizationName: 'RIWI',
  projectName: 'balto',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Balto',
        logo: {
          alt: 'Balto Logo',
          src: 'img/logo.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'technicalSidebar',
            position: 'left',
            label: 'Technical Docs',
          },
          {
            type: 'docSidebar',
            sidebarId: 'userGuideSidebar',
            position: 'left',
            label: 'User Guide',
          },
          {
            href: 'https://github.com/veromarti/174-balto',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Introduction', to: '/' },
              { label: 'Architecture', to: '/technical/architecture' },
              { label: 'User Guide', to: '/user-guide/overview' },
            ],
          },
          {
            title: 'Project',
            items: [
              { label: 'GitHub', href: 'https://github.com/veromarti/174-balto' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Balto — RIWI. Built with Docusaurus.`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['dart', 'yaml', 'json', 'bash'],
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
      },
    }),
};

module.exports = config;
