# All images inherit from this
FROM node:10.16.3-alpine

# [INSTALL IMAGE DEPENDENCIES]

# dependencies that exist in all layers
RUN apk --no-cache add \
    bash \
    tini \
    g++ \
    ca-certificates \
    lz4-dev \
    musl-dev \
    openssl-dev \
    make \
    curl \
    python

ENV NPM_CONFIG_LOGLEVEL error
ENV WITH_SASL 0

# Install bunyan
RUN yarn global add \
    --silent \
    --ignore-optional \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan

RUN mkdir -p /app/source

# [BUILD AND INSTALL THE CONNECTORS]
RUN apk --no-cache add \
    --virtual .build-deps \
    gcc \
    zlib-dev \
    bsd-compat-headers \
    py-setuptools

# Install any built-in connectors in /app/
# use npm because there isn't a package.json
WORKDIR /app

RUN npm init --yes > /dev/null \
    && npm install \
    --quiet \
    --no-package-lock \
    'terafoundation_kafka_connector@~0.5.2'

RUN apk del .build-deps

# [INSTALL AND BUILD PACKAGES]
WORKDIR /app/source
ENV NODE_ENV development

COPY package.json yarn.lock lerna.json .yarnrc /app/source/
COPY scripts /app/source/scripts

# remove the workspaces to the package.json
RUN ./scripts/docker-pkg-fix.js "pre"

# install both dev and production dependencies
RUN yarn \
    --prod=false \
    --no-progress \
    --frozen-lockfile \
    --ignore-optional

# add back the workspaces to the package.json
RUN ./scripts/docker-pkg-fix.js "post"

# Add all of the packages and other required files
COPY packages /app/source/packages

# install the missing packages
RUN yarn \
    --no-cache \
    --prod=false \
    --prefer-offline \
    --frozen-lockfile \
    --ignore-optional

COPY types /app/source/types
COPY tsconfig.json /app/source/

# link and build the missing packages
RUN yarn quick:setup

# [BUILD THE PRODUCTION IMAGE]
ENV NODE_ENV production

# verify @terascope/node-rdkafka is installed right
RUN node -e "require('@terascope/node-rdkafka')"

COPY service.js /app/source/

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
ENV NODE_OPTIONS "--max-old-space-size=2048"

# Use tini to handle sigterm and zombie processes
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "service.js"]
