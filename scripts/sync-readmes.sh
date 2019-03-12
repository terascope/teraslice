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
    local name overview footer license

    name="$(jq -r '.name' "$package/package.json")"
    license="$(jq -r '.license' "$package/package.json")"

    echoerr "* syncing package $name"
    local doc_readme="docs/$package/overview.md"
    local pkg_readme="$package/README.md"

    if [ ! -f "$doc_readme" ]; then
        return
    fi

    overview="$(sed '1,5d;' "$doc_readme")"
    footer="$(cat ./scripts/assets/readme-footer.md)"

    local packageWithin='This a package within the [Teraslice](https://github.com/terascope/teraslice) monorepo'
    local moreDocsHere='more documentation can be found [here](https://terascope.github.io/teraslice/docs/)'

    {
        printf "# %s\n\n" "$name"
        printf "<!-- THIS FILE IS AUTO-GENERATED, EDIT %s INSTEAD -->\n\n" "$doc_readme"
        printf "**NOTE:** %s, %s.\n\n" "$packageWithin" "$moreDocsHere"
        printf "%s\n\n" "$overview"
        printf "%s\n\n" "$footer"
        printf "[%s](./LICENSE) licensed.\n" "$license"
    } >"$pkg_readme"
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
