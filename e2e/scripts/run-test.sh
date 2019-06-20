#!/bin/bash
set -e

export FORCE_COLOR=1

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

logs() {
   ./scripts/logs.sh
}

cleanup() {
    local ps_result
    ps_result="$(docker-compose ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        echoerr "* cleanup running e2e test docker containers" &&
            docker-compose down --volumes --remove-orphans --timeout=5
    fi
}

post_cleanup() {
    if [ "$CI" == "true" ]; then
        (sleep 1; cleanup) || return 0;
    else
        echoerr '[WARN] Make sure to remember to run yarn clean to remove the docker containers';
    fi
}

prepare() {
    if [ "$CI" == "true" ]; then
        echoerr "* pulling image layers for cache..." &&
            docker pull node:10.16.0-alpine &&
            docker pull terascope/teraslice:dev-base &&
            docker pull terascope/teraslice:dev-connectors &&
            echoerr "* building docker image from cache"
            docker build \
                 --cache-from node:10.16.0-alpine \
                 --cache-from terascope/teraslice:dev-base \
                 --cache-from terascope/teraslice:dev-connectors \
                 -t e2e_teraslice ..
    else
        echoerr "* building docker image" &&
            docker build -t e2e_teraslice ..
    fi
}

build() {
    docker-compose up --no-start --build
}

run_test() {
    if [ "$CI" == "true" ]; then
        jest --runInBand || (sleep 1; logs; post_cleanup; exit 1) && (post_cleanup; exit 0);
    else

        jest --runInBand --bail && post_cleanup;
    fi
}

main() {
    cleanup && prepare && build && run_test
}

main "$@"
