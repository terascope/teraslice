#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Install yarn inside travis-ci
USAGE
    exit 1
}

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        echoerr "This script can only be ran in Travis CI"
        exit 1
    fi
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    only_ci

    echoerr "* installing yarn..."
    curl -o- -L https://yarnpkg.com/install.sh | bash
    export PATH="$HOME/.yarn/bin:$PATH"
}

main "$@"
