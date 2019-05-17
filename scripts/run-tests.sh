#!/bin/bash

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

main() {
    local coverage_dir="$PWD/coverage"
    for name in $(yarn --silent lerna list --toposort); do
        local package="${name#\@terascope}"
        echoerr "* running test for package $name"
        pushd "$PWD/packages/$package" > /dev/null;
            yarn test --silent \
                --detectOpenHandles \
                --forceExit \
                --bail \
                --coverageDirectory="$coverage_dir" || exit 1;
        popd > /dev/null;
        echoerr ""
    done
}

main "$@"
