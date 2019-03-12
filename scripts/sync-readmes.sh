#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Sync package README's from the docs folder to their respective packages REAMDE
USAGE
    exit 1
}

check_deps() {
    if [ -z "$(command -v jq)" ]; then
        echoerr "./sync-readmes.sh requires jq installed"
        exit 1
    fi
}

sync_readme() {
    local package="$1"
    local pkg_name pkg_basename name description save_dev global_add installation license
    pkg_basename="$(basename "$package")"

    name="$(jq -r '.name' "$package/package.json")"
    license="$(jq -r '.license' "$package/package.json")"
    description="$(jq -r '.description' "$package/package.json")"
    global_add="$(jq -r '.bin' "$package/package.json")"
    save_dev="$(jq -r '.saveDev' "$package/package.json")"

    pkg_name="$(node -e "const { capitalize, words } = require(\"lodash\"); words(\"$pkg_basename\").map(capitalize).join(' ')")"

    echoerr "* syncing package $name"
    local doc_readme="docs/$package/overview.md"
    local pkg_readme="$package/README.md"

    if [ -n "$global_add" ] && [ "$global_add" != "null" ]; then
        installation="# Using yarn
yarn global add ${name}
# Using npm
npm install --global ${name}"
    elif [ "$save_dev" == "true" ]; then
        installation="# Using yarn
yarn add --dev ${name}
# Using npm
npm install --save-dev ${name}"
    else
        installation="# Using yarn
yarn add ${name}
# Using npm
npm install --save ${name}"
    fi

    local readme_contents="
<!-- THIS FILE IS AUTO-GENERATED, EDIT $doc_readme -->

# $name

> $description

## Installation

\`\`\`bash
$installation
\`\`\`

This a package within the [Teraslice](https://github.com/terascope/teraslice) monorepo. See our [documentation](https://terascope.github.io/teraslice/docs/packages/$pkg_basename/overview) for more information or the [issues](https://github.com/terascope/teraslice/issues?q=is%3Aopen+is%3Aissue+label%3Apkg%2F$pkg_basename) associated with this package

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[$license](./LICENSE) licensed.
"
    echo "$readme_contents" > "$pkg_readme"

    if [ ! -f "$doc_readme" ]; then
        mkdir -p "docs/$package"
        local doc_contents="
---
title: $pkg_name
sidebar_label: $pkg_basename
---

> $description

## Installation

\`\`\`bash
$installation
\`\`\`
"
        echo "$doc_contents" > "$doc_readme"
        return
    fi
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    check_deps

    for package in packages/*; do
        sync_readme "$package"
    done
}

main "$@"
