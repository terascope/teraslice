#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname <[tag|daily|dev]>

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

image_exists() {
    local name="$1"
    local tag="$2"

    local url="https://hub.docker.com/v2/repositories/$name/tags?page_size=10000"
    curl -sfL "$url" | jq -r "[.results | .[] | .name == \"$tag\"] | any"
}

verify_can_push() {
    local name="$1"
    local tag="$2"

    local exists
    exists="$(image_exists "$name" "$tag")"

    if [ "$exists" == 'true' ]; then
        echoerr "ERROR: Image $name:$tag already exists"
        exit 1
    fi

    return 0
}

build_and_push() {
    local name="$1"
    local tag="$2"

    local slug="$name:$tag"

    echoerr "* building $slug ..."
    docker build --pull --tag "$slug" .

    prompt "do you want to push $slug?" &&
        echoerr "* pushing $slug ..." &&
        docker push "$slug"
}

release_dev() {
    local name="$1"

    echoerr "* pull dev layers..." &&
        docker pull node:10.16.0-alpine &&
        docker pull "$name:dev-base" &&
        docker pull "$name:dev-connectors" &&
        echoerr "* building $name:dev-base..." &&
        docker build \
            --tag "$name:dev-base" \
            --cache-from node:10.16.0-alpine \
            --cache-from "$name:dev-base" \
            --target base . &&
        echoerr "* building $name:dev-connectors..." &&
        docker build \
            --tag "$name:dev-connectors" \
            --cache-from node:10.16.0-alpine \
            --cache-from "$name:dev-base" \
            --cache-from "$name:dev-connectors" \
            --target connectors . &&
        echoerr "* pushing $name:dev-base..." &&
        docker push "$name:dev-base" &&
        echoerr "* pushing $name:dev-connectors..." &&
        docker push "$name:dev-connectors"
}

main() {
    local tag
    local arg="$1"
    local name='terascope/teraslice'

    if [ "$arg" == "daily" ]; then
        local timestamp commit_hash

        timestamp="$(date +%Y.%m.%d)"
        commit_hash="$(git rev-parse --short HEAD)"

        tag="daily-${timestamp}-${commit_hash}"
    elif [ "$arg" == "tag" ]; then
        if [ -n "$TRAVIS_TAG" ]; then
            tag="$TRAVIS_TAG"
        else
            tag="v$(jq -r '.version' ./packages/teraslice/package.json)"
        fi
    elif [ "$arg" == "dev" ]; then
        release_dev "$name" && exit 0
    else
        usage
    fi

    verify_can_push "$name" "$tag" &&
        build_and_push "$name" "$tag"
}

main "$@"
