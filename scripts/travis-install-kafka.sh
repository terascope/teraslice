#!/bin/bash

set -e

cmdname=$(basename "$0")

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

usage() {
    cat <<USAGE >&2
Usage:
    $cmdname

    Install kafka inside travis-ci
USAGE
    exit 1
}

only_ci() {
    if [ "$TRAVIS" != "true" ]; then
        echoerr "This script can only be ran in Travis CI"
        exit 1
    fi
}

main() {
    local arg="$1"

    case "$arg" in
    -h | --help | help)
        usage
        ;;
    esac

    only_ci

    if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
        brew install openssl
        export CPPFLAGS="-I/usr/local/opt/openssl/include";
        export LDFLAGS="-L/usr/local/opt/openssl/lib";
    fi

    export KAFKA_HOME="$HOME/.kafka"
    mkdir -p "$KAFKA_HOME"

    if [ -f "$CACHE_DIR/kafka.tgz" ]; then
        echoerr "* downloading kafka"
        wget https://www.apache.org/dist/kafka/2.1.1/kafka_2.11-2.1.1.tgz -O "$CACHE_DIR/kafka.tgz"
    else
        echoerr "* using cache"
    fi

    tar xzf "$CACHE_DIR/kafka.tgz" -C "$KAFKA_HOME" --strip-components 1

    # add bin to path for ease of use
    export PATH="$KAFKA_HOME/bin:$PATH"

    # Run Zookeeper on localhost:2181
    zookeeper-server-start.sh "$KAFKA_HOME/config/zookeeper.properties" > "$KAFKA_HOME/zookeeper.log" &
    sleep 3

    # Run Kafka on localhost:9092
    kafka-server-start.sh "$KAFKA_HOME/config/server.properties" > "$KAFKA_HOME/kafka.log" &
    sleep 3
}

main "$@"
