# NODE_VERSION is set by default in the config.ts, the following value will only
# be used if you build images by default with docker build
ARG NODE_VERSION=22
FROM ghcr.io/terascope/node-base:${NODE_VERSION}

ARG TERASLICE_VERSION
ARG BUILD_TIMESTAMP
ARG GITHUB_SHA

ENV NODE_ENV production

COPY package.json yarn.lock tsconfig.json .yarnrc.yml /app/source/
COPY .yarnclean.ci /app/source/.yarnclean
COPY .yarn /app/source/.yarn
COPY packages /app/source/packages
COPY scripts /app/source/scripts
COPY types /app/source/types

# Check to see if distutils is installed because python 3.12 removed it
RUN python3 -c "import distutils" || (apk update && apk add py3-setuptools)

# Enable Corepack
RUN corepack enable

# Update Yarn to version 4
RUN corepack prepare yarn@4.6.0 --activate

RUN yarn workspaces focus --all \
    && yarn build \
    && yarn workspaces focus --production --all \
    && yarn cache clean


COPY service.js /app/source/

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "import('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

LABEL org.opencontainers.image.version="$TERASLICE_VERSION" \
  org.opencontainers.image.created="$BUILD_TIMESTAMP" \
  org.opencontainers.image.documentation="https://terascope.github.io/teraslice/docs/overview" \
  org.opencontainers.image.licenses="Apache-2.0" \
  org.opencontainers.image.revision="$GITHUB_SHA" \
  org.opencontainers.image.source="https://github.com/terascope/teraslice" \
  org.opencontainers.image.title="Teraslice" \
  org.opencontainers.image.url="https://terascope.github.io/teraslice" \
  org.opencontainers.image.vendor="Terascope"

CMD ["node", "service.js"]
