ARG NODE_VERSION=22

########################
# 1) Builder
########################
FROM node:${NODE_VERSION}-alpine AS builder

ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=error

RUN apk --no-cache add \
      ca-certificates \
      bash \
      python3 \
      build-base 
      # Stuff we are dropping. I was going to replace build-base with gcc, g++ and make as it seems to 
      # be the only things we need from build-base but doesn't impact final image size
      # apk-tools \
      # ca-certificates \
      # libstdc++ \
      # lz4-dev \
      # musl-dev \
      # ncurses-terminfo \
      # libssh2-dev \
      # openssl-dev \
      # cyrus-sasl-dev \
      # zstd-dev \

WORKDIR /app/source
RUN corepack enable

# Copy the minimum required to resolve deps (better cache)
COPY package.json yarn.lock tsconfig.json .yarnrc.yml ./
COPY .yarn ./.yarn

COPY packages ./packages
COPY scripts ./scripts
COPY types ./types

# Install, build, then prune to production deps
RUN yarn --version && node --version && npm --version && \
    yarn workspaces focus --all && \
    yarn build && \
    yarn workspaces focus --production --all && \
    yarn cache clean

# verify teraslice is installed right
RUN node -e "import('teraslice')"


########################
# 2) Runtime
########################
FROM node:${NODE_VERSION}-alpine AS runtime

ARG TERASLICE_VERSION
ARG BUILD_TIMESTAMP
ARG GITHUB_SHA

ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048" \
    NPM_CONFIG_LOGLEVEL=error

# Minimal for runtime: tini for PID1, certs for HTTPS; and bash for exec
RUN apk --no-cache add tini ca-certificates bash

WORKDIR /app/source
RUN corepack enable

# Bring over the built app + production deps
COPY --from=builder /app/source /app/source

COPY service.js /app/source/

# Check if it still works
RUN node -e "import('teraslice')"

# verify what version of librdkafka is installed
RUN node -e "console.log('librdkafka:', require('@confluentinc/kafka-javascript').librdkafkaVersion)"

# Verify what binary confluent client downloaded
# confluent kafka uses 'node-pre-gyp' which has a binary feature in the package.json
# https://nodejs.github.io/node-addon-examples/build-tools/node-pre-gyp/#the-code-classlanguage-textbinarycode-property
# I pull values similar to how node-pre-gyp does:
# https://github.com/mapbox/node-pre-gyp/blob/aa397bd49702c24bfa2110d23307ec1c9a158d59/lib/util/versioning.js#L283-L311
RUN node - <<'EOF'
const pkg = require('@confluentinc/kafka-javascript/package.json');
const os = require('os');
const detect_libc = require('detect-libc');

const version = pkg.version;
const node_abi = process.versions.modules;
const platform = process.platform;
const arch = process.arch;
const libc = detect_libc.familySync() || 'unknown';

const binaryName =
  `${pkg.binary.module_name}-v${version}-node-v${node_abi}-${platform}-${libc}-${arch}.tar.gz`;

const url =
  `${pkg.binary.host}${pkg.binary.remote_path.replace('{version}', version)}/${binaryName}`;

console.log('---- Confluent Kafka Binary Info ----');
console.log('Client version:', version);
console.log('Node ABI:', node_abi);
console.log('Platform:', platform);
console.log('Arch:', arch);
console.log('libc:', libc);
console.log('Binary name:', binaryName);
console.log('Download URL:', url);
console.log('-------------------------------------');
EOF



EXPOSE 5678
# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG=/app/config/teraslice.yaml

LABEL org.opencontainers.image.version="$TERASLICE_VERSION" \
  org.opencontainers.image.created="$BUILD_TIMESTAMP" \
  org.opencontainers.image.documentation="https://terascope.github.io/teraslice/docs/overview" \
  org.opencontainers.image.licenses="Apache-2.0" \
  org.opencontainers.image.revision="$GITHUB_SHA" \
  org.opencontainers.image.source="https://github.com/terascope/teraslice" \
  org.opencontainers.image.title="Teraslice" \
  org.opencontainers.image.url="https://terascope.github.io/teraslice" \
  org.opencontainers.image.vendor="Terascope"

# Make tini PID 1, then exec your service
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "service.js"]
