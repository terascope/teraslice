#!/bin/bash
set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }


get_logs() {
    docker-compose logs --no-color teraslice-worker teraslice-master | awk -F' [|] ' '{print $2}'
}

main() {
    local ps_result
    ps_result="$(docker-compose ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        if [ "$RAW_LOGS" == "true" ] || [ "$RAW_LOGS" == "1" ]; then
            get_logs
        else
            get_logs | bunyan -o short -l "${LOG_LEVEL:-DEBUG}"
        fi
    fi
}

main "$@"
