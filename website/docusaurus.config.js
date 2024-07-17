module.exports = {
    title: 'Teraslice',
    tagline: 'Scalable data processing pipelines in JavaScript',
    url: 'https://terascope.github.io',
    baseUrl: '/teraslice/',
    organizationName: 'terascope',
    projectName: 'teraslice',
    scripts: [
        'https://buttons.github.io/buttons.js',
        'https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js',
        '/teraslice/js/copy-code-block.js'
    ],
    stylesheets: [
        {
            href: '/teraslice/css/custom.css',
            type: 'text/css',
            rel: 'stylesheet'
        }
    ],
    favicon: 'img/favicon.png',
    customFields: {
        docsUrl: 'docs',
    },
    onBrokenLinks: 'log',
    onBrokenMarkdownLinks: 'log',
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                    path: '../docs',
                    sidebarPath: '../website/sidebars.json'
                },
                blog: {
                    path: 'blog'
                },
                theme: {
                    customCss: './src/css/customTheme.css'
                }
            }
        ]
    ],
    plugins: [],
    markdown: {
        mermaid: true,
    },
    themes: ['@docusaurus/theme-mermaid'],
    themeConfig: {
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: true,
        },
        navbar: {
            title: 'Teraslice',
            logo: {
                src: 'img/logo.png'
            },
            items: [
                {
                    to: 'docs/overview',
                    label: 'Docs',
                    position: 'left'
                },
                {
                    to: 'docs/asset-bundles',
                    label: 'Assets',
                    position: 'left'
                },
                {
                    to: 'docs/packages',
                    label: 'Packages',
                    position: 'left'
                },
                {
                    href: 'https://github.com/terascope/teraslice',
                    label: 'GitHub',
                    position: 'left'
                },
                {
                    to: '/help',
                    label: 'Help',
                    position: 'left'
                }
            ]
        },
        image: 'img/docusaurus.png',
        footer: {
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Getting Started',
                            to: 'docs/getting-started.html',
                        },
                        {
                            label: 'Packages',
                            to: 'docs/packages.html',
                        },
                        {
                            label: 'Asset Bundles',
                            to: 'docs/asset-bundles.html',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'Github',
                            to: 'https://github.com/terascope/teraslice',
                        },
                    ],
                },
            ],
            copyright: 'Copyright © 2024 Terascope, LLC',
            logo: {
                src: 'img/logo.png'
            }
        },
        algolia: {
            appId: 'KD1DQTOI4M',
            apiKey: '39a27eca4d31c921b2b412344351996e',
            indexName: 'terascope_teraslice.tmp'
        },
        mermaid: {
            theme: {
                light: 'default',
                dark: 'dark'
            },
            // options: {
            //     primaryColor: '#777',
            //     fontFamily: 'cursive'
            // }
        }
    }
};
