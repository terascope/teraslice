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
        echo $(realpath $(readlink "$path"))
    else
        echo $path
    fi
}

declare -a VOLS=("./config:/app/config")
if test "$MODE" == "dev"
then
    # TODO: Binary dependencies will not work in the container
    VOLS+=("..:/app/source")
    for linked in $(find ../node_modules -type l -maxdepth 1)
    do
        VOLS+=("$(realpath "$linked"):/app/source/node_modules/$(basename "$linked")")
    done
    DOCKERFILE=Dockerfile.dev
else
    make -C .. Dockerfile
    DOCKERFILE=Dockerfile
fi

cat > docker-compose.yml <<DOCKER
# TODO: docker-compose-js won't "scale" with compose format version >= 2.2
version: '2.1'
services:
  teraslice-master:
    build:
      context: ..
      dockerfile: $DOCKERFILE
    ports:
        - "45678:45678"
    links:
        - elasticsearch
    volumes:
$(for vol in ${VOLS[@]}
do
  echo "        - $vol"
done)
    command: node /app/source/service.js -c /app/config/processor-master.yaml
  teraslice-worker:
    build:
      context: ..
      dockerfile: $DOCKERFILE
    links:
        - teraslice-master
        - elasticsearch
    volumes:
$(for vol in ${VOLS[@]}
do
  echo "        - $vol"
done)
    command: node /app/source/service.js -c /app/config/processor-worker.yaml
  elasticsearch:
    # TODO: Will no longer be available in docker hub past 5.5
    image: elasticsearch:${ES_VERSION}
    ports:
        - "49200:49200"
        - "49300:49300"
    volumes:
        - ./config/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
    environment:
        ES_VERSION: ${ES_VERSION}
        ES_JAVA_OPTS: '-Xms1g -Xmx1g'
DOCKER
