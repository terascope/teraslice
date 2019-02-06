#!/bin/bash

set -e

docker_login() {
    local username="$DOCKER_USERNAME"
    local password="$DOCKER_PASSWORD"

    if [ -z "$username" ] || [ -z "$password" ]; then
        (>&2 echo "env DOCKER_USERNAME and DOCKER_PASSWORD are required");
        exit 1;
    fi

    echo "$password" | docker login -u "$username" --password-stdin
}

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

    docker_login
    build_and_push "$slug"
}

main "$@"
