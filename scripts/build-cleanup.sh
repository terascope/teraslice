#!/bin/bash

main() {
    local remove_only="$1"
    if [ -z "$remove_only" ] || [ "$remove_only" == "dist" ]; then
        # ...
        # cleanup remove or empty files (easier for vscode to detect changes)
        # ...
        while IFS= read -r -d '' file; do
            if [[ "$file" =~ \.js$ ]]; then
                echo 'module.exports = {};' > "$file"
            elif [[ "$file" =~ \.ts$ ]]; then
                echo 'export {};' > "$file"
            elif [ -f "$file" ]; then
                rm "$file"
            fi
        done < <(find ./packages -type f \
            -not -path '*/node_modules/*' \
            -and -path '*/dist/*' \
            -print0)
    fi

    if [ -z "$remove_only" ] || [ "$remove_only" == "build" ]; then
        for dir in ./packages/*/build; do
            if [ -d "$dir" ]; then
                rm -r "$dir"
            fi
        done
    fi
}

main "$@"
