#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
pkgdir=$(realpath ${scriptdir}/../builds)
cmdname=$(basename "$0")

set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Build the teraslice and teraslice-cli packages.
USAGE
    exit 1
}

build_teraslice_pkg() {
    echo "Build Teraslice Pkg"
    cd packages/teraslice
    pkg -t node10-linux-x64,node10-macos-x64,node10-win-x64 \
        --out-path ${pkgdir} \
        .
    cd -
}

build_teraslice-cli_pkg() {
    echo "Build Teraslice-cli Pkg"
    cd packages/teraslice-cli
    pkg -t node10-linux-x64,node10-macos-x64,node10-win-x64 \
        --out-path ${pkgdir} \
        .
    cd -
}

setup() {
    mkdir -p ${pkgdir}
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    setup &&
        build_teraslice_pkg &&
        build_teraslice-cli_pkg &&
        ls -lh ${pkgdir}
}

main "$@"