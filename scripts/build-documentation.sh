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

    yarn setup &&
        yarn docs &&
        echo "log: $(git log docs/packages/data-mate/api/function-configs/date/toTimeZoneUsingLocation/overview.md) &&
        cd website &&
        yarn install  &&
        ulimit -n 4096 &&
        yarn run build
}

main "$@"
