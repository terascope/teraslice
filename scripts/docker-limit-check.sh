#!/bin/bash
###
## This checks the docker rate limit
###
TOKEN=$(curl --user "$USER:$PASS" "https://auth.docker.io/token?service=registry.docker.io&scope=repository:ratelimitpreview/test:pull" | jq -r .token)
result=$(curl -sS --head -H "Authorization: Bearer $TOKEN" https://registry-1.docker.io/v2/ratelimitpreview/test/manifests/latest)

echo "$result"
