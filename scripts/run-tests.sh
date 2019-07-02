#!/bin/bash

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

main() {
    for name in $(yarn --silent lerna list --toposort); do
        local package="${name#\@terascope\/}"
        [ "$package" == "docker-compose-js" ] && continue;

        echoerr "* running test for package $name"
        pushd "$PWD/packages/$package";
            yarn test --silent \
                --forceExit \
                --bail || exit 1;
        popd;
        echoerr ""
    done
}

main "$@"
