ARG NODE_VERSION=24

########################
# 1) Builder
########################
FROM node:${NODE_VERSION}-alpine AS builder

ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=error \
    CI=true

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
# corepack is no longer bundled with Node 25+, so install it before enabling.
# pnpm version is driven by the "packageManager" field in package.json.
RUN npm install -g corepack@latest && corepack enable

# Copy the minimum required to resolve deps (better cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

COPY packages ./packages
COPY scripts ./scripts
COPY types ./types

# Install, build, then prune to production deps
RUN pnpm --version && node --version && npm --version && \
    pnpm install --frozen-lockfile && \
    pnpm run build

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
RUN apk --no-cache add tini ca-certificates bash curl

WORKDIR /app/source
# corepack is no longer bundled with Node 25+, so install it before enabling.
# pnpm version is driven by the "packageManager" field in package.json.
RUN npm install -g corepack@latest && corepack enable

# Create an unprivileged user (uid/gid pinned to 10001 to match `USER 10001`).
# /app is root-owned, group 'apps', mode 1775: group members can create entries
# but the sticky bit + root ownership stop them deleting/overwriting root-owned
# code like /app/source. Volume dirs are chowned to the user for runtime writes.
RUN addgroup -S -g 10001 apps && adduser -S -u 10001 -G apps teraslice && \
    mkdir -p /app/config /app/logs /app/assets && \
    chown -R 10001:apps /app/config /app/logs /app/assets && \
    chown root:apps /app && chmod 1775 /app

# Bring over the built app + production deps. Left root-owned (the default) so
# the running teraslice user has read/execute but cannot modify the code.
COPY --from=builder /app/source /app/source

COPY service.js /app/source/

# Drop privileges for everything that follows
USER 10001

# Check if it still works
RUN node -e "import('teraslice')"

# verify what version of librdkafka is installed
# pnpm stores packages in node_modules/.pnpm, so we find the actual path
RUN KAFKA_PATH=$(find node_modules/.pnpm -path '*/@confluentinc/kafka-javascript/package.json' | head -1 | xargs dirname) && \
    node -e "console.log('librdkafka:', require('./$KAFKA_PATH').librdkafkaVersion)"

# Verify what binary confluent client downloaded
# confluent kafka uses 'node-pre-gyp' which has a binary feature in the package.json
# https://nodejs.github.io/node-addon-examples/build-tools/node-pre-gyp/#the-code-classlanguage-textbinarycode-property
# I pull values similar to how node-pre-gyp does:
# https://github.com/mapbox/node-pre-gyp/blob/aa397bd49702c24bfa2110d23307ec1c9a158d59/lib/util/versioning.js#L283-L311
RUN KAFKA_PATH=$(find node_modules/.pnpm -path '*/@confluentinc/kafka-javascript/package.json' | head -1 | xargs dirname) && \
    LIBC_PATH=$(find node_modules/.pnpm -path '*/detect-libc/lib/detect-libc.js' | head -1) && \
    node - "$KAFKA_PATH" "$LIBC_PATH" <<'EOF'
const kafkaPath = process.argv[2];
const libcPath = process.argv[3];
const pkg = require(`./${kafkaPath}/package.json`);
const detect_libc = require(`./${libcPath}`);

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

# Verify what binary repo(s) Valkey GLIDE client downloaded and which it will require 
# Valkey GLIDE uses NAPI-RS to run an architecture specific binary built from rust.
# Each binary has its own NPM repo. Repos will be installed based on arch and platform (could be multiple)
# A single repo will be 'required' at run time.
SHELL ["/bin/bash", "-c"]
RUN VALKEY_GLIDE_PATH=$(find node_modules/.pnpm -path '*/@valkey/valkey-glide/package.json' | head -1 | xargs dirname) && \
    VALKEY_NATIVE_PATHS=$(find node_modules/.pnpm -maxdepth 1 -type d -name '@valkey+valkey-glide-*-*@*') && \
    LIBC_PATH=$(find node_modules/.pnpm -path '*/detect-libc/lib/detect-libc.js' | head -1) && \
    node - "$VALKEY_GLIDE_PATH" "$VALKEY_NATIVE_PATHS" "$LIBC_PATH" <<'EOF'
const valkeyGlidePath = process.argv[2];
const valkeyNativePaths = process.argv[3].split('\n').filter(Boolean);
const libcPath = process.argv[4];

const pkg = require(`./${valkeyGlidePath}/package.json`);
const detect_libc = require(`./${libcPath}`);

const version = pkg.version;
const platform = process.platform;
const arch = process.arch;
const libc = detect_libc.familySync() || 'unknown';

const binaryPackageNames = valkeyNativePaths.map(p => p.split('/').pop());

require(`./${valkeyGlidePath}`);
const loadedNative = Object.keys(require.cache)
  .filter(k => k.endsWith('.node') && k.includes('valkey'))
  .map(k => k.split('/').pop());

console.log('---- Valkey GLIDE Binary Package Info ----');
console.log('Client version:', version);
console.log('Platform:', platform);
console.log('Arch:', arch);
console.log('Family:', libc);
console.log('Binary Packages Installed:', binaryPackageNames);
console.log('Runtime Binary:', loadedNative);
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
