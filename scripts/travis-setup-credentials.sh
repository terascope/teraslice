#!/bin/bash

set -e

require_env() {
    local env_var="$1"
    local env_val

    # shellcheck disable=SC2116
    env_val="$(echo "${!env_var}")";

    if [ -z "$env_val" ]; then
        (>&2 echo "env $env_var is required");
        exit 1;
    fi
}

setup_docker() {
    require_env "DOCKER_USERNAME"
    require_env "DOCKER_PASSWORD"

    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
}

setup_github() {
    require_env "GITHUB_EMAIL"
    require_env "GITHUB_NAME"
    require_env "GITHUB_TOKEN"

    git config --global user.name "${GITHUB_NAME}"
    git config --global user.email "${GITHUB_EMAIL}"

    echo "machine github.com login ${GITHUB_NAME} password ${GITHUB_TOKEN}" > ~/.netrc
}

setup_npm() {
    require_env "NPM_TOKEN"
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
}

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        (>&2 echo "This script can only be ran in Travis CI");
        exit 1;
    fi
}

main() {
    only_ci
    setup_npm
    setup_github
    setup_docker
}

main "$@"
