#!/bin/bash

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"

main() {
    local deps="$1"

    if [ "$deps" == "all" ]; then
        "$SCRIPT_DIR/travis-install-docker-compose.sh" &
        "$SCRIPT_DIR/travis-install-es.sh" &
        "$SCRIPT_DIR/travis-install-yarn.sh" &

        # shellcheck disable=SC2046
        wait $(job -p)
    else
        install_yarn
    fi

    # make it colorful
    export FORCE_COLOR=1
}

main "$@"
