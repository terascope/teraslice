#!/bin/bash

set -e

build_and_push() {
    local slug="$1"
    echo "* building $slug ..."
    docker build --pull -t "$slug" .

    echo "* pushing $slug ..."
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
        (echo >&2 "./scripts/docker-release.sh [tag|daily]")
        exit 1
    fi

    slug="terascope/teraslice:$tag"

    build_and_push "$slug"
}

main "$@"
