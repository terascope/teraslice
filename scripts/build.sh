#!/bin/bash

set -e

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

build() {
    local buildScript name

    name="$(node -pe "require('./package.json').name")"
    buildScript="$(node -pe "require('./package.json').scripts.build || null")"
    if [ "$buildScript" != "null" ]; then
        echo "* building ${name}"
        env FORCE_COLOR=1 yarn build
    fi
}

main() {
    local projectDir
    projectDir="$(script_directory)/../"
    cd "${projectDir}" || return;

    for package in "${projectDir}/packages/"*; do
        cd "$package" || continue;
        build;
    done;

    cd "${projectDir}" || return;
}

main "$@"
