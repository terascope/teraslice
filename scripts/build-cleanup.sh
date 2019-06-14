#!/bin/bash

main() {
    local cwd="$PWD";
    for name in $(yarn --silent lerna list --toposort); do
        local package="${name#\@terascope}"
        local dist_dir="$cwd/packages/$package/dist"
        if [ -d "$dist_dir" ]; then
            rm -rf "$dist_dir"
        fi

        local build_dir="$cwd/packages/$package/build"
        if [ -d "$build_dir" ]; then
            rm -rf "$build_dir"
        fi
    done
}

main "$@"
