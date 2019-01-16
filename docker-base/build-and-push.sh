#!/bin/bash

set -e

build_and_push() {
    local slug="$1"
    echo "* building $slug..."
    docker build --pull --no-cache -t "$slug" .

    echo "* pushing $slug..."
    docker push "$slug"
}

main() {
    local tag slug yn
    tag="$(jq -r '.version' ./package.json)"
    slug="terascope/teraslice-base:v$tag"

    while true; do
        read -p "Do you want to build and push \"$slug\"? " -r yn
        case $yn in
            [Yy]* ) build_and_push "$slug"; break;;
            [Nn]* ) echo; echo "OK: Bump the package.json version in this directory"; exit;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

main "$@"
