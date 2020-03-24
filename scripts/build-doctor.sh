#!/bin/bash

cmdname=$(basename "$0")

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Arguments:
        -y, --yes: say yes to all of the non-optional prompts
        -h, --help: show the help output

    Ensure the monorepo is in a clean state, useful for fixing build or test issues
USAGE
    exit 1
}

prompt() {
    local question="$1"
    local option="${2:-recommended}"

    if [ "$CI" == "true" ] || [ "$SAY_YES" == "true" ]; then
        if [ "$option" == "optional" ]; then
            echoerr "* auto-answer no to $question ($option)"
            return 1;
        fi
        echoerr "* auto-answer yes to $question"
        return 0
    fi

    while true; do
        read -p "$question ($option) " -r yn
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

        if [ -f "$package/yarn-error.log" ]; then
            echoerr "* removing $package/yarn-error.log"
            rm "$package/yarn-error.log"
        fi

        if [ -d "$package/build" ]; then
            echoerr "* removing $package/build"
            rm -rf "$package/build"
        fi

        if [ -d "$package/node_modules" ]; then
            echoerr "* removing $package/node_modules"
            rm -rf "$package/node_modules"
        fi
    done

    if [ -d "e2e/dist" ]; then
        echoerr "* removing e2e/dist"
        rm -rf "e2e/dist"
    fi

    if [ -d "e2e/node_modules" ]; then
        echoerr "* removing e2e/node_modules"
        rm -rf "e2e/node_modules"
    fi

    return 0
}

cleanup_e2e_tests() {
    local ps_result
    ps_result="$(docker-compose --project-directory "./e2e" -f "./e2e/docker-compose.yml" ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        echoerr "* removing running e2e test docker containers" &&
            yarn run --cwd="./e2e" clean || echo '* it is okay'
    fi

    for asset in e2e/autoload/*; do
        if [ -f "$asset" ]; then
            prompt "Autoload asset $asset exists, do you want to remove it?" &&
                echoerr "* removing $asset" &&
                rm "$asset"
        fi
    done

    for log in e2e/logs/*.log; do
        if [ -f "$log" ]; then
            echoerr "* removing $log" &&
            rm "$log"
        fi
    done

    return 0
}

cleanup_top_level() {
    if [ -f "./.eslintcache" ]; then
        echoerr "* removing ./.eslintcache"
        rm -rf "./.eslintcache"
    fi

    if [ -d "./coverage" ]; then
        echoerr "* removing ./coverage"
        rm -rf "./coverage"
    fi

    if [ -f "./yarn-error.log" ]; then
        echoerr "* removing ./yarn-error.log"
        rm "./yarn-error.log"
    fi

    return 0
}

post_cleanup() {
    prompt "Do you want to clear your jest cache?" "optional" &&
        echoerr "* running yarn jest --clear-cache" &&
        yarn jest --clear-cache || echo '* it is okay'

    prompt "Do you want to reinstall and setup the packages?" &&
        ./scripts/reinstall.sh

     prompt "Do you want to run lint:fix?" &&
        echoerr "* running yarn lint:fix" &&
        yarn lint:fix
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    -y | --yes | yes)
        export SAY_YES="true"
        ;;
    esac

    cleanup_top_level &&
        cleanup_packages &&
        cleanup_e2e_tests &&
        post_cleanup
}

main "$@"
