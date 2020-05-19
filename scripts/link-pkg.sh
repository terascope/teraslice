#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname [...<package-name>]

    Link one or more NPM package in all monorepo packages
USAGE
    exit 1
}

link_pkg() {
    local dir="$1"; shift;

    if [ -d "$dir" ]; then
        yarn --cwd="$dir" --silent link "$@"

        if [ -d "$dir/node_modules" ]; then
            rm -rf "$dir/node_modules"
        fi
    fi
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    yarn --silent link "$@"
    link_pkg "e2e" "$@"

    for dir in ./packages/*; do
        link_pkg "$dir" "$@"
    done

    echoerr '* running yarn setup'
    yarn setup
}

main "$@"
