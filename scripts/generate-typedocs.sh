#!/bin/bash

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

list_ts_packages() {
    for pkg_info in $(yarn --silent lerna list --toposort --ndjson); do
        local pkg_dir pkg_json is_typedoc_enabled
        pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
        pkg_json="$pkg_dir/package.json"
        [ ! -f "$pkg_json" ] && continue;

        is_typedoc_enabled="$(jq -r '.enableTypeDocs // false' "$pkg_json")"
        if [ "$is_typedoc_enabled" == "true" ]; then
            echo "$pkg_info"
        fi
    done
}

write_api_file() {
    local tmp_dir="$1"
    local pkg_info="$2"
    local pkg_dir pkg_name name pkg_basename tmp_doc dest_doc contents

    pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
    name="$(echo "$pkg_info" | jq -r '.name')"
    pkg_basename="$(basename "$pkg_dir")"
    tmp_doc="$tmp_dir/docs/packages/${pkg_basename}/README.md"
    dest_doc="./docs/packages/${pkg_basename}/api.md"

    pkg_name="$(node -e "const l = require(\"lodash\"); process.stdout.write(l.words(\"$pkg_basename\").map(l.capitalize).join(' '))")"
    contents="$(tail -n +5 "$tmp_doc")"

    echo "---
title: $pkg_name API
sidebar_label: API
---

> Exported API for $name

$contents" > "$dest_doc"
}

write_api_file() {
    local tmp_dir="$1"
    local pkg_info="$2"
    local pkg_dir pkg_name name pkg_basename tmp_doc dest_doc contents

    pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
    name="$(echo "$pkg_info" | jq -r '.name')"
    pkg_basename="$(basename "$pkg_dir")"
    tmp_doc="$tmp_dir/docs/packages/${pkg_basename}/README.md"
    dest_doc="./docs/packages/${pkg_basename}/api.md"

    pkg_name="$(node -e "const l = require(\"lodash\"); process.stdout.write(l.words(\"$pkg_basename\").map(l.capitalize).join(' '))")"
    contents="$(tail -n +5 "$tmp_doc")"

    echo "---
title: $pkg_name API
sidebar_label: API
---

> Exported API for $name

$contents" > "$dest_doc"
}

generate_docs() {
    local tmp_dir="$1"
    local pkg_info="$2"
    local pkg_dir pkg_basename tmp_docs dest_docs commit_hash base_url

    pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
    pkg_basename="$(basename "$pkg_dir")"
    tmp_docs="$tmp_dir/docs/packages/${pkg_basename}"
    dest_docs="./docs/packages/${pkg_basename}/api/"
    base_url="https://github.com/terascope/teraslice/tree"
    commit_hash="$(git rev-parse HEAD)"

    echoerr "* generating docs for $pkg_basename"
    mkdir -p "$dest_docs"

    pushd "$pkg_dir" > /dev/null
        if [ -d "$pkg_dir/dist" ]; then
            rm -rf "$pkg_dir/dist"
        fi
        yarn --silent typedoc \
            --sourcefile-url-prefix "$base_url/$commit_hash/packages/$pkg_basename/" \
            --theme markdown \
            --readme none \
            --excludePrivate \
            --excludeNotExported \
            --excludeExternals \
            --exclude '**/test/**' \
            --hideGenerator \
            --name "$pkg_basename" \
            --out "$tmp_docs" \
            "."
    popd > /dev/null

    cp -rfp "$tmp_docs" "$dest_docs"
    # write_docs "$tmp_dir" "$pkg_info"
    echoerr "* generated docs for $pkg_basename"
}

main() {
    local tmp_dir
    tmp_dir="$(mktemp -d)"

    mkdir -p "$tmp_dir/website"
    echo '{}' > "$tmp_dir/website/sidebars.json"

    for pkg_info in $(list_ts_packages); do
        generate_docs "$tmp_dir" "$pkg_info";
    done
}

main "$@"
