#!/bin/bash

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

check_deps() {
    if [ -z "$(command -v jq)" ]; then
        echoerr "./publish.sh requires jq installed"
        exit 1
    fi
}

publish() {
    local dryRun="$1"
    local name tag targetVersion currentVersion isPrivate prepublishScript

    name="$(jq -r '.name' package.json)"
    isPrivate="$(jq -r '.private' package.json)"
    if [ "$isPrivate" == 'true' ]; then
        echo "* $name is a private module skipping..."
        return
    fi

    targetVersion="$(jq -r '.version' package.json)"
    currentVersion="$(npm info --json 2>/dev/null | jq -r '.version // "0.0.0"')"

    if [ "$currentVersion" != "$targetVersion" ]; then
        if [ "$name" == "teraslice" ]; then
            if [ -n "$TRAVIS_TAG" ]; then
                echo "* Publishing Teraslice on release $TRAVIS_TAG"
            else
                echo "* Skipping teraslice until release v$targetVersion is created"
                return
            fi
        fi

        if [ "$dryRun" == "false" ]; then
            echoerr "$name@$currentVersion -> $targetVersion"
            yarn publish \
                --tag "$tag" \
                --non-interactive \
                --new-version "$targetVersion" \
                --no-git-tag-version
        else
            echoerr "$name@$currentVersion -> $targetVersion [DRAFT]"

            prepublishScript="$(jq -r '.scripts.prepublishOnly' package.json)"
            if [ -n "$prepublishScript" ] || [ "$prepublishScript" != 'null' ]; then
                yarn run prepublishOnly
            fi
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
        cd "$package" || continue
        publish "$dryRun"
    done

    cd "${projectDir}" || return
}

main "$@"
