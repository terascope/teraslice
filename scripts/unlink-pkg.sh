#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname [...<package-name>]

    Unlink one or more NPM package in all monorepo packages
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

    yarn --silent unlink "$@"

    for dir in ./packages/*; do
        if [ -d "$dir" ]; then
            yarn --silent unlink "$@"

            if [ -d "$dir/node_modules" ]; then
                rm -rf "$dir/node_modules"
            fi
        fi
    done

    echoerr '* reinstalling node modules and running yarn setup'
    yarn --force --check-files && yarn setup
}

main "$@"
