---
title: Development Overview
sidebar_label: Overview
---

## Getting Started

```sh
# Clone the package
git clone https://github.com/terascope/teraslice.git && cd teraslice
# Install, link and compile packages together
yarn && yarn setup
```

### Running Teraslice

```sh
yarn start -c path/to/config.yaml
```

### Running Teraslice in Docker

#### Building the Docker Image

```sh
docker build -t teraslice .
```

#### Starting the container

```sh
docker run -it --rm -v ./teraslice-master.yaml:/app/config/teraslice.yml teraslice
```

## VSCode Configuration

### Recommended Extensions

- [ESlint](https://github.com/Microsoft/vscode-eslint)
- [EditorConfig](https://github.com/editorconfig/editorconfig-vscode)

### Recommended Settings

```js
{
    // use eslint formating
    "editor.formatOnSave": true,
    "editor.formatOnType": true,
    "editor.insertSpaces": true,
    "editor.tabSize": 4,
    "eslint.autoFixOnSave": true,
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact"
    ],
    "javascript.format.enable": false,
    "javascript.preferences.quoteStyle": "single",
    "json.format.enable": false,
    "typescript.format.enable": false,
    "typescript.format.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets": true,
    "typescript.preferences.quoteStyle": "single",
    "files.autoGuessEncoding": true,
    "files.exclude": {
        "**/.DS_Store": true,
        "**/.git": true,
        "**/.hg": true,
        "**/.svn": true,
        "**/.yarn-cache/**": true,
        "**/CVS": true,
        "**/coverage/**": true,
        ".eslintcache": true,
        "assets/**": true
    },
    "files.insertFinalNewline": true,
    "files.trimFinalNewlines": true,
    // use yarn
    "eslint.packageManager": "yarn",
    "npm.packageManager": "yarn",
    // exclude certain files from search and file watching
    // for better performance
    "files.watcherExclude": {
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/.yarn-cache/**": true,
        "**/build/**": true,
        "**/coverage/**": true,
        "**/node_modules/**": true,
        "**/tmp/**": true,
        ".eslintcache": true,
        "assets/**": true
    },
    "search.exclude": {
        "**/.yarn-cache": true,
        "**/bower_components/**": true,
        "**/build/**": true,
        "**/coverage/**": true,
        "**/dist/**": true,
        "**/docs/packages/*/api/**/*.md": true,
        "**/node_modules/**": true,
        "**/vendor/**": true,
        ".eslintcache": true,
        "assets/**": true
    }
}
```
