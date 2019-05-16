#!/bin/bash

set -e

main() {
    local coverage_dir="$PWD/coverage"
    for package in ./packages/*; do
        pushd "$package" > /dev/null;
            yarn test --silent \
                --detectOpenHandles \
                --forceExit \
                --bail \
                --coverageDirectory="$coverage_dir" || exit 1;
        popd > /dev/null;
    done;
}

main "$@"
