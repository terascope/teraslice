#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Setup and verify ci dependencies
USAGE
    exit 1
}

require_env() {
    local env_var="$1"
    local env_val

    # shellcheck disable=SC2116
    env_val="$(echo "${!env_var}")"

    if [ -z "$env_val" ]; then
        echoerr "env $env_var is required"
        exit 1
    fi
}

only_ci() {
    if [ "$CI" != "true" ]; then
        echoerr "This script can only be ran in CI"
        exit 1
    fi
}

setup_docker() {
    # https://docs.travis-ci.com/user/pull-requests/#pull-requests-and-security-restrictions
    [ "$TRAVIS_PULL_REQUEST" == "true" ] && [ -z "$DOCKER_PASSWORD" ] && return;

    require_env "DOCKER_USERNAME"
    require_env "DOCKER_PASSWORD"

    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

    local username
    username="$(docker info | grep Username)"

    echoerr "* logged into docker hub as $username"
}

setup_github() {
    # https://docs.travis-ci.com/user/pull-requests/#pull-requests-and-security-restrictions
    [ "$TRAVIS_PULL_REQUEST" == "true" ] && [ -z "$GITHUB_TOKEN" ] && return;

    require_env "GITHUB_EMAIL"
    require_env "GITHUB_NAME"
    require_env "GITHUB_TOKEN"

    git config --global user.name "${GITHUB_NAME}"
    git config --global user.email "${GITHUB_EMAIL}"

    echo "machine github.com login ${GITHUB_NAME} password ${GITHUB_TOKEN}" >~/.netrc

    echoerr -n "* logged into git as $GITHUB_NAME"
}

setup_npm() {
    # https://docs.travis-ci.com/user/pull-requests/#pull-requests-and-security-restrictions
    [ "$TRAVIS_PULL_REQUEST" == "true" ] && [ -z "$NPM_TOKEN" ] && return;

    require_env "NPM_TOKEN"
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >~/.npmrc

    local username
    username="$(npm whoami)"
    echoerr "* logged into npm ${username}"
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    export FORCE_COLOR=1
    echoerr "* set FORCE_COLOR=1"

    if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
        export REPORT_COVERAGE=false
        echoerr "* set REPORT_COVERAGE=false"
    fi

    only_ci
    setup_npm
    setup_github
    setup_docker
}

main "$@"
