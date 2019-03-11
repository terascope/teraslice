# All images inherit from this
FROM node:10.15-alpine as base

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
    python

ENV NPM_CONFIG_LOGLEVEL error

RUN mkdir -p /app/source
WORKDIR /app/source

# Use tini to handle sigterm and zombie processes
ENTRYPOINT ["/sbin/tini", "--"]

FROM base as connectors

RUN apk --no-cache add \
    --virtual .build-deps \
    gcc \
    zlib-dev \
    bsd-compat-headers \
    py-setuptools

ENV WITH_SASL 0

# Install any built-in connectors in /app/
# use npm because there isn't a package.json
WORKDIR /app/

RUN npm init --yes > /dev/null \
    && npm install \
    --quiet \
    --no-package-lock \
    'terafoundation_kafka_connector@~0.4.0' \
    # clean up node-rdkafka
    && rm -rf node_modules/node-rdkafka/docs \
    node_modules/node-rdkafka/deps/librdkafka

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

COPY --from=connectors /app/node_modules /app/node_modules

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

COPY service.js package.json lerna.json yarn.lock /app/source/
COPY scripts /app/source/scripts

# copy the compiled packages
COPY --from=dev /app/source/packages /app/source/packages
# copy the production node_modules
COPY --from=dev /app/node_modules /app/source/node_modules

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
