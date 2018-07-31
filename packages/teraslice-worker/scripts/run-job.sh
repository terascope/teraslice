#!/bin/bash

start_ex() {
    set -eu -o pipefail 
    echo "* starting execution controller"
    local ex="$1"

    env NODE_TYPE='execution_controller' node command.js \
        --useDebugLogger \
        --executionContext "${ex}" &
}

start_worker() {
    set -eu -o pipefail
    local ex="$1";

    env NODE_TYPE='worker' node command.js \
        --useDebugLogger \
        --executionContext "${ex}" &
}

main() {
    set -eu -o pipefail
    local jobFile="$1" 
    local job
    local workers

    job="$(env NODE_TYPE='util' node job-to-execution-context.js "$jobFile")"

    workers="$(echo "$job" | jq '.workers // 1')"

    echo "* Initializing 1 execution controller and ${workers} workers"

    start_ex "$job"

    echo "* sleeping for 10 seconds"
    sleep 10

    for worker in $(seq 0 "$workers"); do
        echo "* starting worker $((worker+1))"
        start_worker "$job"
    done

    wait
}

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

main "$@"