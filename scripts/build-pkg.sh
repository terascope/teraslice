#!/bin/bash

scriptdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
topdir=$(realpath ${scriptdir}/..)
pkgdir=$(realpath ${topdir}/builds)
cmdname=$(basename "$0")

pkgtargets="node10-linux-x64,node10-macos-x64,node10-win-x64"

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
    cd ${topdir}/packages/teraslice
    pkg -t ${pkgtargets} \
        --out-path ${pkgdir} \
        .
    cd -
}

build_teraslice-cli_pkg() {
    echo "Build Teraslice-cli Pkg"
    cd ${topdir}/packages/teraslice-cli
    pkg -t ${pkgtargets} \
        --out-path ${pkgdir} \
        .
    cd -
}

check() {
    command -v pkg >/dev/null 2>&1 || { echoerr "pkg must be installed: npm install -g pkg"; exit 1; }
}

setup() {
    mkdir -p ${pkgdir}
}

finish() {
    ls -lh ${pkgdir}
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    check &&
        setup &&
        build_teraslice_pkg &&
        build_teraslice-cli_pkg &&
        finish
}

main "$@"