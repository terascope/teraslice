#!/bin/bash

set -e

main() {
    cd website \
        && yarn install \
        && GIT_USER="${GITHUB_NAME}" \
            CURRENT_BRANCH="${TRAVIS_BRANCH:-master}" \
            yarn run publish-gh-pages
}

main "$@"
