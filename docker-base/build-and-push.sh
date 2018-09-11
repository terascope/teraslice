#!/bin/bash

set -e

main() {
    local tag="$1"
    if [ -z "$tag" ]; then
        echo "build-and-push.sh requires a tag as the first arg"
    fi

    docker build -t "terascope/teraslice-base:$tag" .
    docker push "terascope/teraslice-base:$tag" .
}

main "$@"
