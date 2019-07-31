#!/bin/bash

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

main () {
    local host="$1"; shift;
    local CLI=("$@");

    local i;

    if ! command -v curl &> /dev/null; then
        echoerr "* Missing required curl command";
        exit 1;
    fi

    for i in {1..5}; do
        echoerr "* attempt ${i} waiting for host $host..."
        if curl -fSs "$host" 2> /dev/null; then
            echoerr "* $host is ready!"
            break;
        fi

        sleep 2s;
    done

    exec "${CLI[@]}"
}

main "$@"
