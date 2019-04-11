#!/bin/bash

set -e

main() {
    for package in ./packages/*; do
        pushd "$package";
            yarn test --silent \
                --detectOpenHandles \
                --forceExit \
                --bail \
                --coverageDirectory="$PWD/coverage" || exit 1;
        popd;
    done;
}

main "$@"
