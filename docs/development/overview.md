---
title: Development Overview
sidebar_label: Overview
---

## Getting Started

```sh
# Clone the package
git clone https://github.com/terascope/teraslice.git && cd teraslice
# Install, link and compile packages together
yarn setup
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
    "editor.formatOnSave": true,
    "editor.formatOnType": true,
    "editor.insertSpaces": true,
    "editor.tabSize": 4,
    "eslint.autoFixOnSave": true,
    "eslint.packageManager": "yarn",
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact"
    ],
    "files.autoGuessEncoding": true,
    "files.exclude": {
        "**/.git": true,
        "**/.svn": true,
        "**/.hg": true,
        "**/CVS": true,
        "**/.DS_Store": true,
        "**/.cache/**": true,
        "**/.jest-cache/**": true,
        "**/.yarn-cache/**": true,
        "**/.yarn/cache/**": true,
        "**/.yarn-offline-cache/**": true,
        "**/.babel-cache/**": true,
        "**/coverage/**": true,
        ".eslintcache": true,
        "assets/**": true
    },
    "files.insertFinalNewline": true,
    "files.trimFinalNewlines": true,
    "files.watcherExclude": {
        ".eslintcache": true,
        "**/.cache/**": true,
        "**/.git/objects/**": true,
        "**/.git/subtree-cache/**": true,
        "**/.jest-cache/**": true,
        "**/.yarn-cache/**": true,
        "**/.yarn/cache/**": true,
        "**/.yarn-offline-cache/**": true,
        "**/.babel-cache/**": true,
        "**/build/**": true,
        "**/coverage/**": true,
        "**/teranaut/static/**": true,
        "**/tmp/**": true,
        "assets/**": true
    },
    "javascript.format.enable": false,
    "javascript.preferences.quoteStyle": "single",
    "json.format.enable": false,
    "npm.packageManager": "yarn",
    "search.exclude": {
        "**/node_modules/**": true,
        "**/bower_components/**": true,
        "**/vendor/**": true,
        "**/coverage/**": true,
        "**/dist/**": true,
        "**/build/**": true,
        "assets/**": true,
        ".eslintcache": true,
        "**/.cache/**": true,
        "**/.yarn-cache": true,
        "**/.yarn/cache/**": true,
        "**/.yarn-offline-cache/**": true,
        "**/.babel-cache/**": true,
        "**/.jest-cache/**": true,
        "**/docs/packages/*/api/**/*.md": true,
        "**/teranaut/static/**": true
    },
    "typescript.format.enable": false,
    "typescript.format.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets": true,
    "typescript.format.semicolons": "insert",
    "typescript.preferences.quoteStyle": "single",
    "[javascript]": {
        "editor.formatOnSave": false
    },
    "[javascriptreact]": {
        "editor.formatOnSave": false
    },
    "[typescript]": {
        "editor.formatOnSave": false
    },
    "[typescriptreact]": {
        "editor.formatOnSave": false
    }
}
```
