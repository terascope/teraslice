#!/bin/bash

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

main() {
    echoerr "* removing node_modules..."
    rm -rf node_modules
    rm -rf e2e/node_modules
    rm -rf packages/*/node_modules

    echoerr "* removing yarn.lock(s)..."
    rm yarn.lock

    echoerr "* running yarn setup..."
    yarn setup
    yarn sync -q

    echoerr "* running yarn..."
    yarn --check-files
}

main "$@"
