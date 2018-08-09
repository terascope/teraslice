#! /usr/bin/env bash

# Generate a docker-compose.yml that supports multiple modes, namely dev & qa.
# The image used for development will bind-mount local copy of teraslice as well
# as any npm-linked modules. This will allow developers to make changes and test
# without requiring image to be rebuilt and container recreated.

# Get fully resolved symbolic link.
function realpath {
    local path=$1
    if test -L "$path"
    then
        realpath "$(readlink "$path")"
    else
        echo "$path"
    fi
}

# Speed up bind mounts on mac.
if uname | grep -iq 'darwin'
then
    CACHING=":cached"
fi

MODE="${MODE:-dev}"

declare -a VOLS=("./config:/app/config${CACHING}")

echo "* running in $MODE mode"
if test "$MODE" == "dev"
then
    # TODO: Binary dependencies will not work in the container
    VOLS+=("..:/app/source${CACHING}")
    while IFS= read -r -d '' linked
    do
        VOLS+=("$(realpath "$linked"):/app/source/node_modules/$(basename "$linked")${CACHING}")
    done < <(find ../node_modules -type l -maxdepth 1)
fi

cat > docker-compose.yml <<DOCKER
version: '2.2'
services:
  teraslice-master:
    build:
      context: ..
    command: node --max-old-space-size=256 entrypoint.js
    scale: 1
    restart: 'no'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:45678/cluster/state"]
      interval: 15s
      timeout: 10s
      retries: 5
    ports:
      - "45678:45678"
    expose:
      - "45679-46678"
    environment:
        - TERAFOUNDATION_CONFIG=/app/config/processor-master.yaml
    depends_on:
      elasticsearch:
        condition: service_healthy
    links:
        - elasticsearch
    mem_limit: 512m
    stop_grace_period: 30s
    volumes:
$(for vol in "${VOLS[@]}"
do
  echo "        - $vol"
done)
  teraslice-worker:
    build:
      context: ..
    command: node --max-old-space-size=256 entrypoint.js
    scale: 3
    restart: 'no'
    expose:
      - "45679-46678"
    environment:
        - TERAFOUNDATION_CONFIG=/app/config/processor-worker.yaml
    depends_on:
      elasticsearch:
        condition: service_healthy
      teraslice-master:
        condition: service_healthy
    links:
      - teraslice-master
      - elasticsearch
    mem_limit: 512m
    stop_grace_period: 30s
    volumes:
$(for vol in "${VOLS[@]}"
do
  echo "        - $vol"
done)
  elasticsearch:
    build:
      context: ./es
    restart: 'no'
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:49200"]
      interval: 15s
      timeout: 10s
      retries: 5
    ports:
      - "49200:49200"
      - "49300:49300"
    environment:
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    mem_limit: 1g
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
DOCKER
