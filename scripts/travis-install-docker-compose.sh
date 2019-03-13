#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Install docker-compose inside travis-ci
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
    local file="docker-compose"
    local remote_file

    echoerr "* downloading $file..."
    remote_file="docker-compose-$(uname -s)-$(uname -m)"
    curl -L "https://github.com/docker/compose/releases/download/1.22.0/$remote_file" >"$file"

    echoerr "* installing $file..."
    chmod +x "$file"
    sudo rm /usr/local/bin/docker-compose
    sudo mv "$file" /usr/local/bin
}

main "$@"
