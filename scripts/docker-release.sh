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
    local tag slug version timestamp
    local branch="$1"

    version="$(jq -r '.version' ./packages/teraslice/package.json)"
    timestamp="$(date +%m.%d.%y)"

    if [ -n "$branch" ]; then
        tag="$branch-${timestamp}"
    else
        tag="v$version"
    fi

    slug="terascope/teraslice:$tag"

    build_and_push "$slug"
}

main "$@"
