#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname --format [minio|opensearch] <dns_names...>

    Generate a certificate in the e2e/test/certs directory.

    Example:
        generate-cert.sh --format minio 127.0.0.1 localhost service.com
        generate-cert.sh --format opensearch --format minio 127.0.0.1 localhost service.com
        generate-cert.sh 127.0.0.1 localhost service.com  (keeps original file names)

    If no --format is specified, the original files are kept without renaming.
USAGE
    exit 1
}


format() {
    local CERT_DIR="$1"
    shift
    local FORMATS=("$@")  # List of formats passed to the script

    # Move root CA to the correct location
    cd "$CERT_DIR"
    mkdir -p CAs
    mv rootCA.pem ./CAs

    # Detect the generated key and certificate files
    local PRIVATE_KEY_NAME=$(ls | grep -i "key.pem")
    local PUBLIC_CERT_NAME=$(ls | grep -i ".pem" | grep -v "key.pem")

    # Ensure both files exist before proceeding
    if [[ -z "$PRIVATE_KEY_NAME" || -z "$PUBLIC_CERT_NAME" ]]; then
        echo "Error: Could not locate key.pem or public cert in $CERT_DIR" >&2
        exit 1
    fi

    # Rename the files based on requested formats
    for format in "${FORMATS[@]}"; do
        case "$format" in
            minio)
                cp "$PRIVATE_KEY_NAME" private.key
                cp "$PUBLIC_CERT_NAME" public.crt
                ;;
            opensearch)
                cp "$PRIVATE_KEY_NAME" opensearch-key.pem
                cp "$PUBLIC_CERT_NAME" opensearch-cert.pem
                create_internal_users_file "$CERT_DIR"
                ;;
            *)
                echo "Warning: Unknown format '$format' ignored."
                ;;
        esac
    done

    # Remove original files if any format was applied
    if [[ ${#FORMATS[@]} -gt 0 ]]; then
        rm -f "$PRIVATE_KEY_NAME" "$PUBLIC_CERT_NAME"
    fi

    # Add read permissions for CI
    chmod -R a+rX "$CERT_DIR"
}

grab_rootCA() {
    local CERT_DIR="$1"
    local CA_ROOT_PATH=$(mkcert -CAROOT)

    cp "$CA_ROOT_PATH/rootCA.pem" "$CERT_DIR"
}

generate() {
    local CERT_DIR="$1/certs"
    local DNS_NAMES=""
    shift

    # Parse format flags
    local FORMATS=()
    while [[ "$1" == --format ]]; do
        shift
        FORMATS+=("$1")
        shift
    done

    # Collect DNS names
    while [[ $# -gt 0 ]]; do
        DNS_NAMES+="$1 "
        shift
    done

    echo "Generating certificates for: $DNS_NAMES"

    # Remove existing cert directory if it exists
    if [ -d "$CERT_DIR" ]; then
        rm -rf "$CERT_DIR"
    fi

    mkdir -p "$CERT_DIR"
    cd "$CERT_DIR"
    mkcert --client $DNS_NAMES

    grab_rootCA "$CERT_DIR"
    format "$CERT_DIR" "${FORMATS[@]}"

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
    # Handle help flag
    if [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
        usage
    fi

    # Verify required dependencies
    if ! command -v mkcert &>/dev/null; then
        echo 'Error: mkcert is not installed. Please install mkcert and try again.' >&2
        exit 1
    fi

    if ! command -v grep &>/dev/null; then
        echo 'Error: grep is not installed. Please install grep and try again.' >&2
        exit 1
    fi

    # Find cert directory in e2e
    local SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
    local TEST_DIR=$(builtin cd "$SCRIPT_DIR/../e2e/test"; pwd)

    generate "$TEST_DIR" "$@"
}

main "$@"
