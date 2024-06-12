#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Generate a certifcate in the e2e/test/certs directory
    Example: generate-cert.sh 127.0.0.1 localhost service.com
USAGE
    exit 1
}


format() {
    local CERT_DIR="$1"

    # Grab rootCA from mkcert folder and move to correct location
    cd "$CERT_DIR"
    mkdir CAs
    mv rootCA.pem ./CAs

    # Rename files to proper names
    local PRIVATE_KEY_NAME=$(ls | grep -i "key.pem")
    mv $PRIVATE_KEY_NAME private.key
    local PUBLIC_CERT_NAME=$(ls | grep -i ".pem")
    mv $PUBLIC_CERT_NAME public.crt
}

grab_rootCA() {
    local CERT_DIR="$1"
    local CA_ROOT_PATH=$(mkcert -CAROOT)

    cd "$CA_ROOT_PATH"
    cp rootCA.pem "$CERT_DIR"
}


generate() {

    local CERT_DIR="$1"/certs
    local DNS_NAMES=""

    # remove first arg in arg array
    shift

    for arg in "$@"; do
        DNS_NAMES+="$arg "
    done
    echo "$DNS_NAMES"
    if [ -d "$CERT_DIR" ]; then
        rm -rf $CERT_DIR
    fi

    mkdir "$CERT_DIR"
    cd "$CERT_DIR"
    mkcert $DNS_NAMES

    grab_rootCA "$CERT_DIR"
    format "$CERT_DIR"

    echo "Successfully created certificates at $CERT_DIR"
    exit 0

}


main() {
    # Add args later for other serice encryption formats.
    # Only works for minio for now

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    # verfiy mkcert is installed
    if ! [ -x "$(command -v mkcert)" ]; then
        echo 'Error: mkcert is not installed. please install mkcert and try again.' >&2
        exit 1
    fi

    # verfiy grep is installed
    if ! [ -x "$(command -v grep)" ]; then
        echo 'Error: grep is not installed. please install grep and try again.' >&2
        exit 1
    fi

    # find cert directory in e2e
    local SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
    local TEST_DIR=$(builtin cd "$SCRIPT_DIR/../e2e/test"; pwd)

    generate "$TEST_DIR" "$@"


}

main "$@"
