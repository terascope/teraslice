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

upgrade_interactive() {
    local cwd_arg="$1"

    echoerr '* upgrading root packages...'

    yarn --cwd "$cwd_arg" &&
    yarn --cwd "$cwd_arg" upgrade-interactive --latest
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    rm -rf packages/*/node_modules

    echoerr '* cleaning yarn cache...'
    yarn cache clean

    upgrade_interactive '.'

    ./scripts/reinstall.sh
}

main "$@"
