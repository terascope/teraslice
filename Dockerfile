# All images inherit from this
FROM node:10.15-alpine as base

# dependencies that exist in all layers
RUN apk --no-cache add bash tini

ENV NPM_CONFIG_LOGLEVEL error

RUN mkdir -p /app/source
WORKDIR /app/source

# Use tini to handle sigterm and zombie processes
ENTRYPOINT ["/sbin/tini", "--"]

FROM base as connectors

# install the dependencies required for node-rdkafka
# see https://github.com/Blizzard/node-rdkafka/blob/master/examples/docker-alpine.md
RUN apk --no-cache add \
    g++ \
    ca-certificates \
    lz4-dev \
    musl-dev \
    cyrus-sasl-dev \
    openssl-dev \
    make \
    python

RUN apk add --no-cache --virtual \
    .build-deps \
    gcc \
    zlib-dev \
    libc-dev \
    bsd-compat-headers \
    py-setuptools

# Install any built-in connectors in /app/
# use npm because there isn't a package.json
WORKDIR /app/
RUN export WITH_SASL=0 \
    && npm set progress=false \
    && npm config set depth 0 \
    && npm install --quiet 'terafoundation_kafka_connector@~0.3.0'

# the dev image should contain all of dev code
FROM base as dev

COPY package.json yarn.lock lerna.json /app/source/
COPY packages /app/source/packages

# Build just the production node_modules and copy them over
RUN yarn \
    --prod=true \
    --no-progress \
    --no-emoji \
    && cp -Rp node_modules /app/node_modules

ENV NODE_ENV development

# install both dev and production dependencies
RUN yarn \
    --prod=false \
    --no-progress \
    --ignore-optional \
    --no-emoji

# Prepare the node modules for isntallation
COPY tsconfig.json /app/source/
COPY types /app/source/types

# Build the packages
RUN yarn run build:prod

# the prod image should small
FROM base as prod

# Install bunyan
RUN yarn global add \
    --silent \
    --ignore-optional \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan

ENV NODE_ENV production

COPY service.js package.json lerna.json yarn.lock /app/source/
COPY --from=connectors /app/node_modules /app/node_modules
COPY --from=dev /app/node_modules /app/source/node_modules
COPY --from=dev /app/source/packages /app/source/packages

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
