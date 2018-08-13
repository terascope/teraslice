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

publish() {
    local dir="$1"
    local dryRun="$2"
    local suffix="$3"
    local name targetVersion currentVersion

    pushd "$dir" > /dev/null
        name="$(cat package.json | jq -r '.name')"
        targetVersion="$(cat package.json | jq -r '.version')${suffix}"
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
    popd "$dir" > /dev/null
}

write_npmrc() {
    if [ -z "$NPM_TOKEN" ]; then
        echo 'Missing NPM_TOKEN in environment';
        exit 1;
    fi

    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >> ~/.npmrc
}

main() {
    local commitHash suffix releaseType='release' dryRun='false'

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

    local projectDir="$(script_directory)/../"
    for package in ${projectDir}/packages/*; do
        publish "$package" "$dryRun" "$suffix";
    done
}

main "$@"