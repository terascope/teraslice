#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Get a random port
USAGE
    exit 1
}

find_port() {
    local used_ports;

    local port;
    for i in $(seq 1 10); do
        # get a random port between 40000 and 65535
        port="$((40000 + RANDOM % 25536))"
        used_ports="$(netstat -an | grep '^tcp' | awk '{print $4}' | tr '.:' ' ' | awk '{print $NF}' | sort -n | uniq)"

        if [[ " $used_ports " =~ $port ]]; then
            [ "$i" != "1" ] && echoerr "* port $port is NOT available (attempt $i)"
        else
            [ "$i" != "1" ] && echoerr "* port $port is available (attempt $i)"
            echo "$port"
            return 0;
        fi
    done

    echo "$port"
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    find_port
}

main "$@"
