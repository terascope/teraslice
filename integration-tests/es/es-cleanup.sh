#!/bin/bash

if ! command -v curl > /dev/null; then
    echo "Missing curl command"
    exit 1
fi

ES_HOST="http://0.0.0.0:49200"

while ! curl --fail --silent "$ES_HOST" > /dev/null; do
    sleep 1
done;

curl -fsS -XDELETE "$ES_HOST/tera*" && echo ' - Removed tera* indexes'
curl -fsS -XDELETE "$ES_HOST/test*" && echo ' - Removed test* indexes'
if [ -n "$INDEX_SETTINGS" ]; then
    curl -fsS -XPUT \
        -H 'Content-Type: application/json' \
        "$ES_HOST/_all/_settings?ignore_unavailable=true&allow_no_indices=true" \
        -d "$INDEX_SETTINGS" \
        && echo " - Updated ES settings $INDEX_SETTINGS"
fi
