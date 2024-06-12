module.exports={
  "title": "Teraslice",
  "tagline": "Scalable data processing pipelines in JavaScript",
  "url": "https://terascope.github.io",
  "baseUrl": "/teraslice/",
  "organizationName": "terascope",
  "projectName": "teraslice",
  "scripts": [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/teraslice/js/copy-code-block.js"
  ],
  "stylesheets": [
    "/teraslice/css/copy-code-block.css",
    "/teraslice/css/custom.css"
  ],
  "favicon": "img/favicon.png",
  "customFields": {},
  "onBrokenLinks": "log",
  "onBrokenMarkdownLinks": "log",
  "presets": [
    [
      "@docusaurus/preset-classic",
      {
        "docs": {
          "showLastUpdateAuthor": true,
          "showLastUpdateTime": true,
          "path": "../docs",
          "sidebarPath": "../website/sidebars.json"
        },
        "blog": {
          "path": "blog"
        },
        "theme": {
          "customCss": "../src/css/customTheme.css"
        }
      }
    ]
  ],
  "plugins": [],
  "themeConfig": {
    "navbar": {
      "title": "Teraslice",
      "logo": {
        "src": "img/logo.png"
      },
      "items": [
        {
          "to": "docs/overview",
          "label": "Docs",
          "position": "left"
        },
        {
          "to": "docs/asset-bundles",
          "label": "Assets",
          "position": "left"
        },
        {
          "to": "docs/packages",
          "label": "Packages",
          "position": "left"
        },
        {
          "href": "https://github.com/terascope/teraslice",
          "label": "GitHub",
          "position": "left"
        },
        {
          "to": "/help",
          "label": "Help",
          "position": "left"
        }
      ]
    },
    "image": "img/docusaurus.png",
    "footer": {
      "links": [],
      "copyright": "Copyright © 2024 Terascope, LLC",
      "logo": {
        "src": "img/logo.png"
      }
    },
    "algolia": {
      "apiKey": "b074b9b57bfd2e4d8b411aee052825d2",
      "indexName": "terascope_teraslice"
    }
  }
}
