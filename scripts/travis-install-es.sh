#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Install elasticsearch inside travis-ci
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
    local file="elasticsearch-6.5.4.deb"

    echoerr "* downloading $file..."
    curl -O "https://artifacts.elastic.co/downloads/elasticsearch/$file"

    echoerr "* installing $file..."
    sudo dpkg -i --force-confnew "$file"
    sudo service elasticsearch restart
}

main "$@"
