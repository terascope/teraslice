#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Build and publish documentation website to github pages
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

    pnpm run setup &&
        pnpm run docs &&
        git add -f docs/packages/*/api &&
        cd website &&
        pnpm install &&
        pnpm run build &&
        git reset ../docs/packages/*/api
}

main "$@"
