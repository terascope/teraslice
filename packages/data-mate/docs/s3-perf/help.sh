#!/usr/bin/env bash
# Printed when the container starts with no command. Kept plain and short —
# the full manual is README.md in this directory.
set -euo pipefail
HOME_DIR="${S3_PERF_HOME:-/app/source/packages/data-mate/docs/s3-perf}"
ENV_FILE="${S3_PERF_ENV_FILE:-/app/config/s3.env}"

cat <<BANNER

  DuckFrame / DuckDB  —  S3 performance harness
  =============================================

  Config : ${ENV_FILE}          <- edit this first
  Scripts: ${HOME_DIR}/scripts
  Results: ${S3_PERF_RESULTS:-/app/results}
  Manual : ${HOME_DIR}/README.md

  RUN THESE IN ORDER. Each is independent and safe to re-run.

    ./run.sh doctor      check config, extensions and that Ceph answers
    ./run.sh discover    inventory the bucket: objects, schema, row groups
    ./run.sh battery     the timed query battery (8 shapes)
    ./run.sh caches      the three httpfs caches ON vs OFF, with bytes moved
    ./run.sh layout      query cost vs row-group and object count
    ./run.sh duckframe   the DuckFrame API itself against S3
    ./run.sh memory      the memory-limit sweep and the wide top-N cliff

    ./run.sh all         everything above, in order

  START HERE:  ./run.sh doctor

  Nothing here generates or uploads data. Every script reads the objects
  already in the bucket named by S3_BUCKET.

BANNER
