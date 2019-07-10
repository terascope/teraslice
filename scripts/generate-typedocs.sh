#!/bin/bash

set -e

ROOT_DIR="$(pwd)"
TMP_DIR="$(mktemp -d)"

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

get_name() {
    local input="$1"
    node -e "const l = require(\"$ROOT_DIR/node_modules/lodash\"); process.stdout.write(l.words(\"$input\").map(l.capitalize).join(' '))"
}

list_ts_packages() {
    for pkg_info in $(yarn --silent lerna list --toposort --ndjson); do
        local pkg_dir tsconfig typedoc_options
        pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
        tsconfig="$pkg_dir/tsconfig.json"
        [ ! -f "$tsconfig" ] && continue;

        typedoc_options="$(jq -r '.typedocOptions' "$tsconfig")"
        if [ "$typedoc_options" != "null" ]; then
            echo "$pkg_info"
        fi
    done
}

write_doc_file() {
    local copy_from="$1"
    local copy_to="$2"
    local name="$3"
    local pkg_name="$4"
    local contents copy_to_folder api_name file_name

    file_name="$(basename "$copy_to")"
    file_name="${file_name%\.md}"
    contents="$(tail -n +3 "$copy_from" | sed "s/README\.md/overview\.md/g")"
    copy_to_folder="$(dirname "$copy_to")"
    if [ "$file_name" == "overview" ]; then
        api_name="API"
    else
        api_name="$(get_name "$file_name")"
    fi
    mkdir -p "$copy_to_folder"
    echoerr "Write API doc file: ${copy_to#$ROOT_DIR/}"

    echo "---
title: $pkg_name $api_name
sidebar_label: $api_name
---

$contents" > "$copy_to"
}

generate_docs() {
    local pkg_info="$1"
    local name pkg_dir pkg_name pkg_basename tmp_docs dest_docs commit_hash base_url

    name="$(echo "$pkg_info" | jq -r '.name')"
    pkg_dir="$(echo "$pkg_info" | jq -r '.location')"
    pkg_basename="$(basename "$pkg_dir")"
    tmp_docs="$TMP_DIR/docs/packages/${pkg_basename}"
    dest_docs="$ROOT_DIR/docs/packages/${pkg_basename}/api"
    pkg_name="$(get_name "$pkg_basename")"
    base_url="https://github.com/terascope/teraslice/tree"
    commit_hash="$(git rev-parse HEAD)"

    echoerr "* generating docs for $pkg_basename"
    if [ -d "$dest_docs" ]; then
        rm -rf "$dest_docs"
    fi
    mkdir -p "$dest_docs"

    pushd "$pkg_dir" > /dev/null
        if [ -d "$pkg_dir/dist" ]; then
            rm -rf "$pkg_dir/dist"
        fi
        yarn --silent typedoc \
            --sourcefile-url-prefix "$base_url/$commit_hash/packages/$pkg_basename/" \
            --tsconfig "$pkg_dir/tsconfig.json" \
            --out "$tmp_docs" \
            "." &&
            yarn build
    popd > /dev/null

    pushd "$tmp_docs" > /dev/null
        if [ -f "$tmp_docs/README.md" ]; then
            write_doc_file "$tmp_docs/README.md" "$dest_docs/overview.md" "$name" "$pkg_name"
        fi
        for copy_from in **/*.md; do
            [[ -e "$copy_from" ]] || break
            write_doc_file "$tmp_docs/$copy_from" "$dest_docs/$copy_from" "$name" "$pkg_name"
        done
    popd > /dev/null

    echoerr "* generated docs for $pkg_basename"
}

main() {
    mkdir -p "$TMP_DIR/website"
    echo '{}' > "$TMP_DIR/website/sidebars.json"

    for pkg_info in $(list_ts_packages); do
        generate_docs "$pkg_info";
    done
}

main "$@"
