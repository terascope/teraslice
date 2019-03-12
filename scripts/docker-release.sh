#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname <[tag|daily]>

    Build and push a teraslice docker image
USAGE
    exit 1
}

prompt() {
    local question="$1"

    if [ "$CI" == "true" ]; then
        echoerr "* auto-answer yes to $question since this is running in CI"
        return 0
    fi

    while true; do
        read -p "$question " -r yn
        case $yn in
        [Yy]*)
            return 0
            break
            ;;
        [Nn]*)
            echoerr "Skipping..."
            return 1
            ;;
        *) echoerr "Please answer yes or no." ;;
        esac
    done
}

build_and_push() {
    local slug="$1"
    echoerr "* building $slug ..."
    docker build --pull -t "$slug" .

    prompt "do you want to push $slug?" &&
        echoerr "* pushing $slug ..." &&
        docker push "$slug"
}

main() {
    local tag slug version timestamp commit_hash
    local arg="$1"

    version="$(jq -r '.version' ./packages/teraslice/package.json)"
    timestamp="$(date +%Y.%m.%d)"
    commit_hash="$(git rev-parse --short HEAD)"

    if [ "$arg" == "daily" ]; then
        tag="daily-${timestamp}-${commit_hash}"
    elif [ "$arg" == "tag" ]; then
        tag="v$version"
    else
        usage
    fi

    slug="terascope/teraslice:$tag"

    build_and_push "$slug"
}

main "$@"
