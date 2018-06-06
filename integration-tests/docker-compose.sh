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
version: '2.4'
services:
  teraslice-master:
    build:
      context: ..
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:45678/cluster/state"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "45678:45678"
    depends_on:
      elasticsearch:
        condition: service_healthy
    links:
        - elasticsearch
    stop_grace_period: 30s
    volumes:
$(for vol in "${VOLS[@]}"
do
  echo "        - $vol"
done)
    command: node /app/source/service.js -c /app/config/processor-master.yaml
  teraslice-worker:
    build:
      context: ..
    scale: 4
    depends_on:
      elasticsearch:
        condition: service_healthy
      teraslice-master:
        condition: service_healthy
    links:
      - teraslice-master
      - elasticsearch
    stop_grace_period: 30s
    volumes:
$(for vol in "${VOLS[@]}"
do
  echo "        - $vol"
done)
    command: node /app/source/service.js -c /app/config/processor-worker.yaml
  elasticsearch:
    # TODO: Will no longer be available in docker hub past 5.5
    image: elasticsearch:${ES_VERSION}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:49200"]
      interval: 2s
      timeout: 2s
      retries: 10
    ports:
      - "49200:49200"
      - "49300:49300"
    volumes:
      - ./config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
    environment:
      - "ES_VERSION=${ES_VERSION}"
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    mem_limit: 2g
    ulimits:
      memlock:
        soft: -1
        hard: -1
      nofile:
        soft: 65536
        hard: 65536
DOCKER
