#!/bin/bash

set -e

main() {
    cd website \
        && yarn install \
        && GIT_USER="${GITHUB_NAME}" yarn run publish-gh-pages
}

main "$@"
