#!/bin/bash
set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }


get_logs() {
    local args=("$@")
    docker-compose logs --no-color "${args[@]}" teraslice-worker teraslice-master | awk -F' [|] ' '{print $2}'
}

main() {
    local args=("$@")
    local ps_result
    ps_result="$(docker-compose ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        if [ "$RAW_LOGS" == "true" ] || [ "$RAW_LOGS" == "1" ]; then
            get_logs "${args[@]}" 2>&1
        else
            local color=""
            if [ "$FORCE_COLOR" == "1" ]; then
                color="--color"
            fi
            get_logs "${args[@]}" | bunyan "$color" -o short -l "${LOG_LEVEL:-DEBUG}"
        fi
    fi
}

main "$@"
