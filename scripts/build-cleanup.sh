#!/bin/bash

main() {
    local remove_only="$1"
    if [ -z "$remove_only" ] || [ "$remove_only" == "dist" ]; then
        rm -rf packages/*/dist
    fi

    if [ -z "$remove_only" ] || [ "$remove_only" == "build" ]; then
        rm -rf packages/*/build
    fi
}

main "$@"
