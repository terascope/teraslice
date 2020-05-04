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

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    yarn --silent link "$@"
    yarn --cwd "e2e" --silent link "$@"

    for dir in ./packages/*; do
        if [ -d "$dir" ]; then
            yarn --cwd "$dir" --silent link "$@"
        fi
    done

    echoerr '* running yarn setup'
    yarn setup
}

main "$@"
