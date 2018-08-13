#!/bin/bash

script_directory(){
  local source="${BASH_SOURCE[0]}"
  local dir=""

  while [ -h "$source" ]; do # resolve $source until the file is no longer a symlink
    dir="$( cd -P "$( dirname "$source" )" && pwd )"
    source="$(readlink "$source")"
    [[ $source != /* ]] && source="$dir/$source" # if $source was a relative symlink, we need to resolve it relative to the path where the symlink file was located
  done

  dir="$( cd -P "$( dirname "$source" )" && pwd )"

  echo "$dir"
}

check_deps() {
    if [ -z "$(command -v jq)" ]; then
        echo "./publish.sh requires jq installed"
        exit 1
    fi
}

publish() {
    local dir="$1"
    local dryRun="$2"
    local suffix="$3"
    local name targetVersion currentVersion isPrivate

    pushd "$dir" > /dev/null || return
        name="$(jq -r '.name' package.json)"
        isPrivate="$(jq -r '.private' package.json)"
        if [ "$isPrivate" == 'true' ]; then
            echo "* $name is a private module skipping..."
            return;
        fi
        targetVersion="$(jq -r '.version' package.json)${suffix}"
        currentVersion="$(npm info --json 2> /dev/null | jq -r '.version // "0.0.0"')"

        if [ -z "$currentVersion" ]; then
            currentVersion="0.0.0"
        fi

        if [ "$currentVersion" != "$targetVersion" ]; then
            echo "$name@$currentVersion -> $targetVersion"
            if [ "$dryRun" == "false" ]; then
                npm publish
            fi
        fi
    popd "$dir" > /dev/null || return;
}

main() {
    check_deps

    local projectDir commitHash suffix releaseType='release' dryRun='false'

    if [ "$1" == '--dry-run' ]; then
        dryRun='true'
        shift;
    elif [ "$2" == "--dry-run" ]; then
        dryRun='true'
    fi

    if [ -n "$1" ]; then
        releaseType="$1"
    fi

    commitHash="$(git log --pretty=format:'%h' -n 1)"

    if [ "$releaseType" == "release" ]; then
        suffix=""
    elif [ "$releaseType" == "draft" ]; then
        suffix="-beta.${commitHash}"
    else
        echo 'release type must be either draft or release'
        exit 1
    fi

    projectDir="$(script_directory)/../"
    for package in "${projectDir}/packages/"*; do
        publish "$package" "$dryRun" "$suffix";
    done
}

main "$@"
