#!/bin/bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
LOG_PATH="$DIR/../logs/teraslice.log"

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

get_logs() {
    local args=("$@")
    tail "${args[@]}" "$LOG_PATH"
}

main() {
    local args=("$@")
    if [ ! -f "$LOG_PATH" ]; then
        echo -n '' > "$LOG_PATH"
    fi

    if [ "$RAW_LOGS" == "true" ] || [ "$RAW_LOGS" == "1" ]; then
        get_logs "${args[@]}" 2>&1
    else
        local color="--color"
        if [ "$FORCE_COLOR" == "0" ]; then
            color="--no-color"
        fi
        get_logs "${args[@]}" | bunyan "$color" -o short -l "${LOG_LEVEL:-"DEBUG"}"
    fi
}

main "$@"
