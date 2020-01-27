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
    echoerr "* upgrading packages in $PWD..." &&
        yarn && yarn upgrade-interactive --latest --caret &&
        echoerr '* reinstalling node_modules .' &&
        rm -rf node_modules && yarn --force --check-files --update-checksums &&
        echoerr '* running yarn setup...' &&
        yarn setup
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    upgrade_interactive
    cd e2e && upgrade_interactive;
}

main "$@"
