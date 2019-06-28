#!/bin/bash

main() {
    local remove_only="$1"
    local cwd="$PWD";
    for name in $(yarn --silent lerna list --toposort); do
        local package="${name#\@terascope}"
        if [ -z "$remove_only" ] || [ "$remove_only" == "dist" ]; then
            local dist_src_dir="$cwd/packages/$package/dist/src"
            local dist_test_dir="$cwd/packages/$package/dist/test"
            if [ -d "$dist_src_dir" ]; then
                rm -rf "${dist_src_dir:?}/*"
            fi
            if [ -d "$dist_test_dir" ]; then
                rm -rf "${dist_test_dir:?}/*"
            fi
        fi

        if [ -z "$remove_only" ] || [ "$remove_only" == "build" ]; then
            local build_dir="$cwd/packages/$package/build"
            if [ -d "$build_dir" ]; then
                rm -rf "$build_dir"
            fi
        fi
    done
}

main "$@"
