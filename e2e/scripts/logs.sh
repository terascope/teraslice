#!/bin/bash
set -e

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }


main() {
    local ps_result
    ps_result="$(docker-compose ps -q 2>/dev/null)"
    if [ -n "$ps_result" ]; then
        if [ "$CI" == "true" ]; then
            docker-compose logs --tail=1000 --no-color teraslice-worker teraslice-master | awk -F' [|] ' '{print $2}' | bunyan -o short -l WARN
        else
            docker-compose logs --no-color teraslice-worker teraslice-master | awk -F' [|] ' '{print $2}' | bunyan -o short
        fi
    fi
}

main "$@"
