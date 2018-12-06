FROM terascope/teraslice-base:v0.1.4

RUN mkdir -p /app/source/packages/teraslice \
    && mkdir -p /app/source/packages/teraslice-messaging \
    && mkdir -p /app/source/packages/job-components \
    && mkdir -p /app/source/packages/elasticsearch-api \
    && mkdir -p /app/source/packages/error-parser \
    && mkdir -p /app/source/packages/queue

# copy just the package.json's so we can have faster build times
COPY package.json yarn.lock lerna.json /app/source/
COPY packages/teraslice/package.json /app/source/packages/teraslice/package.json
COPY packages/teraslice-messaging/package.json /app/source/packages/teraslice-messaging/package.json
COPY packages/job-components/package.json /app/source/packages/job-components/package.json
COPY packages/elasticsearch-api/package.json /app/source/packages/elasticsearch-api/package.json
COPY packages/error-parser/package.json /app/source/packages/error-parser/package.json
COPY packages/queue/package.json /app/source/packages/queue/package.json

RUN yarn --frozen-lockfile --link-duplicates \
    && yarn bootstrap:prod \
    && yarn cache clean

# Build just the typescript
COPY tsconfig.json /app/source/
COPY types /app/source/types
COPY packages/queue /app/source/packages/queue
COPY packages/job-components /app/source/packages/job-components
COPY packages/teraslice-messaging /app/source/packages/teraslice-messaging

RUN yarn build:prod \
    && rm -rf node_modules/typescript \
    && rm -rf node_modules/@types

# copy everything else
COPY service.js /app/source/
COPY scripts /app/source/scripts
COPY packages /app/source/packages

ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
