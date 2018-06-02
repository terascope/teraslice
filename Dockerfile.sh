#! /usr/bin/env bash

# Pull in dependencies from package.json so we can take advantage of caching
# without introducing potential for out-of-date dependencies.

cat <<DOCKER
FROM node:8
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source
WORKDIR /app/source
COPY package.json /app/source

RUN npm set progress=false && npm config set depth 0
RUN npm install --only=production

COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs
DOCKER
