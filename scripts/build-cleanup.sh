#!/bin/bash

main() {
    local remove_only="$1"
    local cwd="$PWD";
    for name in $(yarn --silent lerna list --toposort); do
        local package="${name#\@terascope/}"
        if [ -z "$remove_only" ] || [ "$remove_only" == "dist" ]; then
            local dist_dir="$cwd/packages/$package/dist"
            if [ -d "$dist_dir" ]; then
                # delete all files except the dist/src/index
                # to avoid reloading vscode
                find "$dist_dir" \
                    -not -path '*src/index*' \
                    -and \
                    -not -name 'dist' \
                    -print0 | xargs rm -r --
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
