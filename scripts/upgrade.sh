#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Upgrade the node modules interatively
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

    yarn upgrade-interactive --latest --caret &&
        echoerr '* reinstalling node_modules' &&
        rm -rf node_modules &&
        echoerr '* running yarn setup' &&
        yarn setup
}

main "$@"
