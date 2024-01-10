# NODE_VERSION is set by default in the config.ts, the following value will only
# be used if you build images by default with docker build
ARG NODE_VERSION=18.18.2
FROM node:${NODE_VERSION}-bookworm as base

ENV NPM_CONFIG_LOGLEVEL error
ENV WITH_SASL 0

RUN node --version
RUN yarn --version
RUN npm --version

RUN mkdir -p /app/source

# Install bunyan
RUN yarn global add \
    --ignore-optional \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan

# Install any built-in connectors in /app/
# use npm because there isn't a package.json
WORKDIR /app

RUN npm init --yes &> /dev/null \
    && npm install \
    --build \
    --no-package-lock \
    --no-optional \
    'terafoundation_kafka_connector@~0.11.1' \
    && npm cache clean --force

WORKDIR /app/source

# verify node-rdkafka is installed right
RUN node --print --eval "require('node-rdkafka')"

COPY scripts/docker-pkg-fix.js /usr/local/bin/docker-pkg-fix
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it

ENV NODE_OPTIONS "--max-old-space-size=2048"

ENV NODE_ENV production

ENV YARN_SETUP_ARGS "--prod=false --silent --frozen-lockfile"

COPY package.json yarn.lock tsconfig.json .yarnrc /app/source/
COPY .yarnclean.ci /app/source/.yarnclean
COPY .yarn /app/source/.yarn
COPY packages /app/source/packages
COPY scripts /app/source/scripts
COPY types /app/source/types

RUN yarn --prod=false --frozen-lockfile \
    && yarn build \
    && yarn \
      --prod=true \
      --silent \
      --frozen-lockfile \
      --skip-integrity-check \
      --ignore-scripts \
    && yarn cache clean


COPY service.js /app/source/

FROM node:${NODE_VERSION}-bookworm-slim

COPY --from=base /app /app

RUN apt-get update && \
     apt-get install -y libcurl4 tini

WORKDIR /app/source

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

# Use tini to handle sigterm and zombie processes
ENTRYPOINT ["/usr/bin/tini", "--"]

CMD ["node", "service.js"]
