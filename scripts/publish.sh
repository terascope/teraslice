#!/bin/bash

check_deps() {
    if [ -z "$(command -v jq)" ]; then
        echo "./publish.sh requires jq installed"
        exit 1
    fi
}

publish() {
    local dryRun="$1"
    local name tag targetVersion currentVersion isPrivate

    name="$(jq -r '.name' package.json)"
    isPrivate="$(jq -r '.private' package.json)"
    if [ "$isPrivate" == 'true' ]; then
        echo "* $name is a private module skipping..."
        return;
    fi

    targetVersion="$(jq -r '.version' package.json)"
    currentVersion="$(npm info --json 2> /dev/null | jq -r '.version // "0.0.0"')"

    if [ "$currentVersion" != "$targetVersion" ]; then
        echo "$name@$currentVersion -> $targetVersion"
        if [ "$dryRun" == "false" ]; then
            yarn publish \
                --silent \
                --tag "$tag" \
                --non-interactive \
                --new-version "$targetVersion" \
                --no-git-tag-version
        fi
    fi
}

main() {
    check_deps
    local projectDir dryRun='false'

    if [ "$1" == '--dry-run' ]; then
        dryRun='true'
    fi

    projectDir="$(pwd)"

    for package in "${projectDir}/packages/"*; do
        cd "$package" || continue;
        publish "$dryRun";
    done;

    cd "${projectDir}" || return;
}

main "$@"
