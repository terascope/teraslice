#!/bin/bash

set -e

check_deps() {
    if [ -z "$(command -v jq)" ]; then
        echo "./sync-readmes.sh requires jq installed"
        exit 1
    fi
}

sync_readme() {
    local package="$1"
    local name overview footer license

    name="$(jq '.name' "$package/package.json")";
    license="$(jq '.license' "$package/package.json")";

    echo "* syncing package $name"
    local doc_readme="docs/$package/overview.md";
    local pkg_readme="$package/README.md";

    if [ ! -f "$doc_readme" ]; then
        return;
    fi

    overview="$(cat "$doc_readme")"
    footer="$(cat ./scripts/assets/readme-footer.md)"

    {
        printf "# %s\n\n" "$name" > "$pkg_readme"
        printf "<!-- copied from %s -->\n" "$doc_readme"
        printf "<!-- THIS FILE IS AUTO-GENERATED, EDIT %s INSTEAD -->\n" "$doc_readme"
        printf "%s\n\n" "$overview"
        printf "%s\n" "$footer"
        printf "[%s](./LICENSE) licensed.\n" "$license"
    } > "$pkg_readme"
}

main() {
    check_deps

    for package in packages/*; do
        sync_readme "$package"
    done;
}

main "$@"
