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
    cp private.key opensearch-key.pem
    cp public.crt opensearch-cert.pem
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
    mkcert --client $DNS_NAMES

    grab_rootCA "$CERT_DIR"
    format "$CERT_DIR"
    create_internal_users_file "$CERT_DIR"

    echo "Successfully created certificates at $CERT_DIR"
    exit 0

}

create_internal_users_file() {
    local CERT_DIR="$1"

    cat <<EOF > "$CERT_DIR/internal_users.yml"
# This is the internal user database
# The hash value is a bcrypt hash and can be generated with plugin/tools/hash.sh

_meta:
  type: "internalusers"
  config_version: 2

# Define your internal users here

## Demo users
# This hash password is passwordsufhbivbU123%$
admin:
  hash: "\$2y\$12\$Z234bambHnVJMAXiccuMluNgGhNNdOFIY6pFT2/lk3ZC.RDoDIFme"
  reserved: true
  backend_roles:
  - "admin"
  description: "Demo admin user"
anomalyadmin:
  hash: "\$2y\$12\$TRwAAJgnNo67w3rVUz4FIeLx9Dy/llB79zf9I15CKJ9vkM4ZzAd3."
  reserved: false
  opendistro_security_roles:
  - "anomaly_full_access"
  description: "Demo anomaly admin user, using internal role"
kibanaserver:
  hash: "\$2a\$12\$4AcgAt3xwOWadA5s5blL6ev39OXDNhmOesEoo33eZtrq2N0YrU3H."
  reserved: true
  description: "Demo OpenSearch Dashboards user"
kibanaro:
  hash: "\$2a\$12\$JJSXNfTowz7Uu5ttXfeYpeYE0arACvcwlPBStB1F.MI7f0U9Z4DGC"
  reserved: false
  backend_roles:
  - "kibanauser"
  - "readall"
  attributes:
    attribute1: "value1"
    attribute2: "value2"
    attribute3: "value3"
  description: "Demo OpenSearch Dashboards read only user, using external role mapping"
logstash:
  hash: "\$2a\$12\$u1ShR4l4uBS3Uv59Pa2y5.1uQuZBrZtmNfqB3iM/.jL0XoV9sghS2"
  reserved: false
  backend_roles:
  - "logstash"
  description: "Demo logstash user, using external role mapping"
readall:
  hash: "\$2a\$12\$ae4ycwzwvLtZxwZ82RmiEunBbIPiAmGZduBAjKN0TXdwQFtCwARz2"
  reserved: false
  backend_roles:
  - "readall"
  description: "Demo readall user, using external role mapping"
snapshotrestore:
  hash: "\$2y\$12\$DpwmetHKwgYnorbgdvORCenv4NAK8cPUg8AI6pxLCuWf/ALc0.v7W"
  reserved: false
  backend_roles:
  - "snapshotrestore"
  description: "Demo snapshotrestore user, using external role mapping"
EOF
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
