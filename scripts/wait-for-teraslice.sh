#!/bin/bash

echoerr() { if [[ $QUIET -ne 1 ]]; then echo "$@" 1>&2; fi; }

main () {
    local host="$1"; shift;
    local CLI=("$@");

    local i;

    for i in {1..30}; do
        echoerr "* attempt ${i} waiting for teraslice to up at $host..."
        if curl -fSs "$host" 2> /dev/null; then
            echoerr "* teraslice is ready!"
            break;
        fi

        sleep "${i}s";
    done

    exec "${CLI[@]}"
}

main "$@"
