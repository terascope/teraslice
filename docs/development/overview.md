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

### Running Teraslice Natively

Teraslice with built-in (native) clustering can be run either using [Docker Compose](#using-docker-compose) or [standalone](#standalone) on a PC, provided that the required  opensearch service is started separately.

### Standalone

Teraslice is written in Node.js and has been tested on Linux and Mac OS X.

#### Dependencies

- Node.js (24 or above)
- Yarn (4.6 or above)
- At least one opensearch 1.x, 2.x or 3.x

#### Running

Create a configuration file called `config.yaml`:

```yaml
terafoundation:
    connectors:
        elasticsearch-next:
            default:
                node:
                    - "http://localhost:9200" # ensure port matches that of your ES/OS instance

teraslice:
    workers: 8
    master: true
    master_hostname: 127.0.0.1
    name: teraslice
    hostname: 127.0.0.1
```

Starting a single-node teraslice instance:

NOTE: Opensearch must be running first.

```sh
teraslice -c config.yaml
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

### Using docker compose

If you want to get a simple cluster going, use the example docker-compose file. This will provide a teraslice cluster master, one teraslice worker and the following services:

- opensearch2
- kafka
- minio.

```sh
docker-compose up --build
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
