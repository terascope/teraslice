#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ ${QUIET:-0} -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname --format [minio|opensearch|kafka] <dns_names...> --dirPath [absolute path]

    Generate a certificate in a specified absolute directory.

    Examples:
        $cmdname --format minio 127.0.0.1 localhost service.com --dirPath /abs/out
        $cmdname --format opensearch --format minio 127.0.0.1 localhost service.com --dirPath=/abs/out
        $cmdname 127.0.0.1 localhost service.com --dirPath /abs/out  (keeps original file names)

    If no --format is specified, the original files are kept without renaming.
    If --dirPath is not specified, this command will exit with an error.
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
    local PRIVATE_KEY_NAME
    PRIVATE_KEY_NAME=$(ls | grep -i "key.pem" || true)
    local PUBLIC_CERT_NAME
    PUBLIC_CERT_NAME=$(ls | grep -i ".pem" | grep -v "key.pem" || true)

    # Ensure both files exist before proceeding
    if [[ -z "$PRIVATE_KEY_NAME" || -z "$PUBLIC_CERT_NAME" ]]; then
        echo "Error: Could not locate key.pem or public cert in $CERT_DIR" >&2
        exit 1
    fi

    # Rename the files based on requested formats
    for format in "${FORMATS[@]}"; do
        case "$format" in
            minio)
                # https://min.io/docs/minio/linux/operations/network-encryption.html
                cp "$PRIVATE_KEY_NAME" private.key
                cp "$PUBLIC_CERT_NAME" public.crt
                ;;
            opensearch)
                # https://opensearch.org/docs/latest/security/configuration/tls/#x509-pem-certificates-and-pkcs-8-keys
                cp "$PRIVATE_KEY_NAME" opensearch-key.pem
                cp "$PUBLIC_CERT_NAME" opensearch-cert.pem
                create_internal_users_file "$CERT_DIR"
                ;;
            kafka)
                # https://kafka.apache.org/documentation/#security_ssl_signing
                cat "$PRIVATE_KEY_NAME" "$PUBLIC_CERT_NAME" > kafka-keypair.pem
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
    local CA_ROOT_PATH
    CA_ROOT_PATH=$(mkcert -CAROOT)

    cp "$CA_ROOT_PATH/rootCA.pem" "$CERT_DIR"
}

generate() {
    # Parse args: collect --dirPath, multiple --format, and DNS names
    local DIR_PATH=""
    local -a FORMATS=()
    local -a DNS_NAMES=()

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help|help)
                usage
                ;;
            --format)
                shift
                [[ $# -gt 0 ]] || { echoerr "Error: --format requires a value"; usage; }
                FORMATS+=("$1")
                ;;
            --format=*)
                FORMATS+=("${1#*=}")
                ;;
            --dirPath)
                shift
                [[ $# -gt 0 ]] || { echoerr "Error: --dirPath requires a value"; usage; }
                DIR_PATH="$1"
                ;;
            --dirPath=*)
                DIR_PATH="${1#*=}"
                ;;
            -*)
                echoerr "Error: Unknown flag '$1'"
                usage
                ;;
            *)
                DNS_NAMES+=("$1")
                ;;
        esac
        shift
    done

    if [[ -z "$DIR_PATH" ]]; then
        echoerr "Error: --dirPath is required"
        usage
    fi

    if [[ "$DIR_PATH" != /* ]]; then
        echoerr "Error: --dirPath must be an absolute path (starts with /)"
        exit 1
    fi

    if [[ ${#DNS_NAMES[@]} -eq 0 ]]; then
        echoerr "Error: At least one DNS name is required"
        usage
    fi

    local CERT_DIR="$DIR_PATH"

    echo "Generating certificates for: ${DNS_NAMES[*]}"
    echo "Output directory: $CERT_DIR"

    # Remove existing cert directory if it exists
    if [[ -d "$CERT_DIR" ]]; then
        rm -rf "$CERT_DIR"
    fi

    mkdir -p "$CERT_DIR"
    cd "$CERT_DIR"
    mkcert --client "${DNS_NAMES[@]}"

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
    # Handle help flag early
    if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "help" ]]; then
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

    # All arg parsing happens in generate now
    generate "$@"
}

main "$@"
