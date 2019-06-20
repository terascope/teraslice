#!/bin/bash

cmdname=$(basename "$0")

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Ensure the monorepo is in a clean state. This script does the following:
    - Removes dist & build & coverage folders
    - Will prompt to delete any packages that no longer exist
    - Will prompt to clean up running e2e test docker files
    - Will prompt to delete any autoloaded asset
    - Will prompt to run verify node_modules
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

package_exists() {
    local package="$1"
    if git ls-files --error-unmatch "$package" &>/dev/null; then
        return 1
    else
        return 0
    fi
}

cleanup_packages() {
    for package in packages/*; do
        local pkg_basename
        pkg_basename="$(basename "$package")"

        if [ ! -d "$package" ] ||
            [ "$pkg_basename" == "node_modules" ] ||
            [ "$pkg_basename" == "coverage" ]; then

            local q="$package should not exist, do you want to remove it?"
            prompt "$q" &&
                echoerr "* removing $package" &&
                rm -rf "$package"
            continue
        fi

        if package_exists "$package"; then
            local q="$package appears to no longer exist, do you want to remove it?"
            prompt "$q" &&
                echoerr "* removing $package" &&
                rm -rf "$package"
            continue
        fi

        if [ -d "$package/dist" ]; then
            echoerr "* removing $package/dist"
            rm -rf "$package/dist"
        fi

        if [ -d "$package/coverage" ]; then
            echoerr "* removing $package/coverage"
            rm -rf "$package/coverage"
        fi

        if [ -d "$package/build" ]; then
            echoerr "* removing $package/build"
            rm -rf "$package/build"
        fi
    done

    return 0
}

cleanup_e2e_tests() {
    local ps_result
    ps_result="$(docker-compose --project-directory "./e2e" -f "./e2e/docker-compose.yml" ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        echoerr "* removing running e2e test docker containers" &&
            yarn run test:e2e:clean
    fi

    for asset in e2e/autoload/*; do
        if [ -f "$asset" ]; then
            prompt "Autoload asset $asset exists, do you want to remove it?" &&
                echoerr "* removing $asset" &&
                rm -rf "$asset"
        fi
    done

    return 0
}

cleanup_top_level() {
    if [ -d "./coverage" ]; then
        echoerr "* removing ./coverage"
        rm -rf "./coverage"
    fi

    return 0
}

post_cleanup() {
    prompt "Do you want to verify/rebuild the node_modules?" &&
        echoerr "* running yarn --force --check-files --update-checksums" &&
        rm -rf '.yarn-cache' &&
        yarn --force --check-files --update-checksums

    prompt "Do you want to rebuild the packages?" &&
        echoerr "* running yarn setup" &&
        yarn setup
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    cleanup_top_level &&
        cleanup_packages &&
        cleanup_e2e_tests &&
        post_cleanup
}

main "$@"
