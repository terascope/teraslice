#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

main() {
    "$SCRIPT_DIR/travis-install-docker-compose.sh" &
    "$SCRIPT_DIR/travis-install-es.sh" &
    "$SCRIPT_DIR/travis-install-yarn.sh" &

    # shellcheck disable=SC2046
    wait $(jobs -p)
}

main "$@"
