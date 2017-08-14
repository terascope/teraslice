#! /usr/bin/env bash

# Pull in dependencies from package.json so we can take advantage of caching
# without introducing potential for out-of-date dependencies.

cat <<DOCKER
FROM node:4
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source

WORKDIR /app/source

RUN npm install $(python3 - <<PYTHON
import json
deps = json.load(open('package.json')).get('dependencies').items()
print(' \\\\\n    '.join('{}@{}'.format(*i) for i in sorted(deps)))
PYTHON
)

COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs
DOCKER
