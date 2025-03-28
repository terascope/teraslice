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
        parseFrontMatter: async (params) => {
            // Wrap title value in double quotes if it has illegal character ':'
            if (params?.fileContent.startsWith('---\n' + 'title: ')) {
                const lines = params.fileContent.split('\n');
                const titleLine = lines[1];
                const lineParts = titleLine.split(':');
                if (lineParts.length > 2) { // there are 2 or more colons
                    let lineValue = titleLine.slice(7);
                    if (lineValue && lineValue.includes(':')) {
                        lineValue = `"${lineValue}"`;
                        lines[1] = `${lineParts[0]}: ${lineValue}`;
                        params.fileContent = lines.join('\n');
                    }
                }
            }
            const result = await params.defaultParseFrontMatter(params);
            return result;
        }

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
                    href: 'https://terascope.github.io/helm-charts',
                    label: 'Chart',
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
                            to: 'docs/getting-started',
                        },
                        {
                            label: 'Packages',
                            to: 'docs/packages',
                        },
                        {
                            label: 'Asset Bundles',
                            to: 'docs/asset-bundles',
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
                        {
                            to: 'https://terascope.github.io/helm-charts',
                            label: 'Chart'
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Terascope, LLC`,
            logo: {
                src: 'img/logo.png'
            }
        },
        algolia: {
            appId: 'KD1DQTOI4M',
            apiKey: '39a27eca4d31c921b2b412344351996e',
            indexName: 'terascope_teraslice'
        },
        mermaid: {
            theme: {
                light: 'default',
                dark: 'dark'
            },
        }
    }
};
