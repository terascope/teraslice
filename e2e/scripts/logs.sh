#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
LOG_PATH="$DIR/../logs/teraslice.log"

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

show_help() {
    cat << EOF
Usage: logs.sh [OPTIONS] [TAIL_ARGS]

View and filter Teraslice logs with bunyan formatting.

OPTIONS:
    -h, --hostname HOSTNAME    Filter logs by hostname (shortcut for -c "this.hostname == 'HOSTNAME'")
    -c, --condition CONDITION  Filter logs using custom bunyan condition
    --help                     Show this help message and exit

TAIL_ARGS:
    Any additional arguments are passed directly to the tail command.
    Common examples:
        -f              Follow log output (tail -f)
        -n NUM          Show last NUM lines
        -n +NUM         Show from line NUM onwards

ENVIRONMENT VARIABLES:
    RAW_LOGS          Set to "true" or "1" to skip bunyan formatting
    FORCE_COLOR       Set to "0" to disable color output
    LOG_LEVEL         Set bunyan log level filter (default: DEBUG)

EXAMPLES:
    # Follow logs in real-time
    ./logs.sh -f

    # Filter logs by hostname
    ./logs.sh --hostname worker-1

    # Follow logs filtered by hostname
    ./logs.sh -f --hostname execution-controller-1

    # Filter by custom condition (e.g., specific module)
    ./logs.sh -c "this.module == 'worker'"

    # Filter by log level
    ./logs.sh -c "this.level >= 40"

    # Filter by ex_id (execution ID)
    ./logs.sh -c "this.ex_id == 'abc123'"

    # Combine multiple conditions (AND)
    ./logs.sh -c "this.hostname == 'worker-1' && this.level >= 40"

    # Filter by message content
    ./logs.sh -c "this.msg.indexOf('error') >= 0"

    # Show last 100 lines for a specific hostname
    ./logs.sh -n 100 --hostname master

    # View raw logs without bunyan formatting
    RAW_LOGS=true ./logs.sh -f

BUNYAN CONDITION SYNTAX:
    Conditions are JavaScript expressions evaluated against each log entry.
    Common fields: hostname, level, msg, module, ex_id, job_id, slice_id
    Operators: ==, !=, <, >, <=, >=, &&, ||
    Methods: indexOf(), match(), etc.

EOF
}

get_logs() {
    local args=("$@")
    tail "${args[@]}" "$LOG_PATH"
}

main() {
    local hostname=""
    local condition=""
    local tail_args=()

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help)
                show_help
                exit 0
                ;;
            --hostname|-h)
                hostname="$2"
                shift 2
                ;;
            --condition|-c)
                condition="$2"
                shift 2
                ;;
            *)
                tail_args+=("$1")
                shift
                ;;
        esac
    done

    if [ ! -f "$LOG_PATH" ]; then
        echo -n '' > "$LOG_PATH"
    fi

    if [ "$RAW_LOGS" == "true" ] || [ "$RAW_LOGS" == "1" ]; then
        get_logs "${tail_args[@]}" 2>&1
    else
        local color="--color"
        if [ "$FORCE_COLOR" == "0" ]; then
            color="--no-color"
        fi

        local bunyan_cmd="bunyan $color -o short -l ${LOG_LEVEL:-"DEBUG"}"

        # Apply hostname filter (shortcut for condition)
        if [ -n "$hostname" ]; then
            bunyan_cmd="$bunyan_cmd -c \"this.hostname == '$hostname'\""
        fi

        # Apply custom condition
        if [ -n "$condition" ]; then
            bunyan_cmd="$bunyan_cmd -c \"$condition\""
        fi

        get_logs "${tail_args[@]}" | eval "$bunyan_cmd"
    fi
}

main "$@"
