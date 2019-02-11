#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        (>&2 echo "This script can only be ran in Travis CI");
        exit 1;
    fi
}

main() {
    only_ci

    "$SCRIPT_DIR/travis-install-docker-compose.sh" &
    "$SCRIPT_DIR/travis-install-es.sh" &
    "$SCRIPT_DIR/travis-install-yarn.sh" &

    # shellcheck disable=SC2046
    wait $(jobs -p)
}

main "$@"
