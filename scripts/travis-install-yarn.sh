#!/bin/bash

set -e

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        (>&2 echo "This script can only be ran in Travis CI");
        exit 1;
    fi
}

main() {
    only_ci
    echo "* installing yarn..."
    curl -o- -L https://yarnpkg.com/install.sh | bash
    export PATH="$HOME/.yarn/bin:$PATH"
}

main "$@"
