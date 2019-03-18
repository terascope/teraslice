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

    cd website &&
        yarn install &&
        GIT_USER="${GITHUB_NAME}" \
            CURRENT_BRANCH="${TRAVIS_BRANCH:-master}" \
            yarn run publish-gh-pages
}

main "$@"
