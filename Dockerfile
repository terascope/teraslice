# All images inherit from this
FROM node:10.16.3-alpine AS base

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

RUN mkdir -p /app/source /app/connectors
WORKDIR /app/source

# Use tini to handle sigterm and zombie processes
ENTRYPOINT ["/sbin/tini", "--"]

# Install the connectors in a different layer
FROM base AS connectors

RUN apk --no-cache add \
    --virtual .build-deps \
    gcc \
    zlib-dev \
    bsd-compat-headers \
    py-setuptools

ENV WITH_SASL 0

# Install any built-in connectors in /app/
# use npm because there isn't a package.json
WORKDIR /app/connectors

RUN npm init --yes > /dev/null \
    && npm install \
    --quiet \
    --no-package-lock \
    'terafoundation_kafka_connector@~0.4.2' \
    # clean up node-rdkafka
    && rm -rf node_modules/node-rdkafka/docs \
    node_modules/node-rdkafka/deps/librdkafka

# the deps image should contain all of dev code
FROM base AS deps

COPY package.json yarn.lock lerna.json .yarnrc /app/source/
COPY packages /app/source/packages

ENV NODE_ENV development

# install both dev and production dependencies
RUN yarn \
    --no-cache \
    --prod=false \
    --frozen-lockfile \
    --ignore-optional

# Prepare the node modules for isntallation
COPY types /app/source/types
COPY tsconfig.json /app/source/

# Build the packages
RUN yarn quick:setup

# the prod image should small
FROM base

# Install bunyan
RUN yarn global add \
    --silent \
    --ignore-optional \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan

ENV NODE_ENV production

COPY --from=connectors /app/connectors/node_modules /app/node_modules

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

COPY service.js package.json lerna.json yarn.lock .yarnrc /app/source/
COPY scripts /app/source/scripts

# copy the compiled packages
COPY --from=deps /app/source/packages /app/source/packages
# copy the production node_modules
COPY --from=deps /app/source/node_modules /app/source/node_modules

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
