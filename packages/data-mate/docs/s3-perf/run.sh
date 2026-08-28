#!/usr/bin/env bash
#
# The single entry point. Every script is independent and safe to re-run.
#
#   ./run.sh doctor|discover|battery|caches|layout|duckframe|memory|all
#
# Environment overrides pass straight through, so a one-off change needs no
# edit to the env file:
#
#   THREADS=4 ./run.sh battery
#   LIMITS=32MiB,64MiB ./run.sh memory
#
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS="$HERE/scripts"

declare -a ORDER=(doctor discover battery caches layout duckframe memory)

script_for() {
    case "$1" in
        doctor)    echo "$SCRIPTS/00-doctor.mjs" ;;
        discover)  echo "$SCRIPTS/01-discover.mjs" ;;
        battery)   echo "$SCRIPTS/02-battery.mjs" ;;
        caches)    echo "$SCRIPTS/03-caches.mjs" ;;
        layout)    echo "$SCRIPTS/04-layout.mjs" ;;
        duckframe) echo "$SCRIPTS/05-duckframe.mjs" ;;
        memory)    echo "$SCRIPTS/06-memory.mjs" ;;
        *)         echo "" ;;
    esac
}

usage() {
    cat <<USAGE
Usage: ./run.sh <step>

Steps, in the order to run them:

  doctor      check config, extensions and that the endpoint answers
  discover    inventory the bucket: objects, schema, row groups, sizes
  battery     the timed query battery (up to 10 shapes)
  caches      the three httpfs caches ON vs OFF, with bytes moved
  layout      query cost against the row-group and object census
  duckframe   the DuckFrame API itself against S3
  memory      the memory-limit sweep and the wide top-N cliff

  all         every step above, in order, stopping at the first failure

Config: ${S3_PERF_ENV_FILE:-/app/config/s3.env}
Manual: $HERE/README.md
USAGE
}

if [[ $# -lt 1 ]]; then usage; exit 1; fi

step="$1"; shift || true

if [[ "$step" == "all" ]]; then
    # doctor gates everything: if the endpoint is wrong, every later failure is
    # a confusing symptom of the same cause.
    for s in "${ORDER[@]}"; do
        echo
        echo "############################################################"
        echo "#  ./run.sh $s"
        echo "############################################################"
        if ! node "$(script_for "$s")" "$@"; then
            echo
            echo "STOPPED: '$s' failed. Fix it before continuing —" >&2
            echo "later steps would fail the same way." >&2
            exit 1
        fi
    done
    echo
    echo "All steps completed. Results in ${RESULTS_DIR:-/app/results}"
    exit 0
fi

target="$(script_for "$step")"
if [[ -z "$target" ]]; then
    echo "Unknown step: $step" >&2
    echo >&2
    usage >&2
    exit 1
fi

exec node "$target" "$@"
