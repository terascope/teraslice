FROM terascope/teraslice-base:v0.2.0

# copy just the package.json's so we can have faster build times
RUN mkdir -p /app/source/packages/
COPY package.json yarn.lock lerna.json /app/source/
COPY packages/teraslice/package.json /app/source/packages/teraslice/package.json
COPY packages/terafoundation/package.json /app/source/packages/terafoundation/package.json
COPY packages/teraslice-messaging/package.json /app/source/packages/teraslice-messaging/package.json
COPY packages/job-components/package.json /app/source/packages/job-components/package.json
COPY packages/elasticsearch-api/package.json /app/source/packages/elasticsearch-api/package.json
COPY packages/error-parser/package.json /app/source/packages/error-parser/package.json
COPY packages/queue/package.json /app/source/packages/queue/package.json
COPY packages/utils/package.json /app/source/packages/utils/package.json

RUN yarn --link-duplicates \
    && yarn bootstrap:prod \
    && yarn cache clean

# Build just the typescript
COPY tsconfig.json /app/source/
COPY types /app/source/types
COPY packages/utils /app/source/packages/utils
COPY packages/queue /app/source/packages/queue
COPY packages/job-components /app/source/packages/job-components
COPY packages/teraslice-messaging /app/source/packages/teraslice-messaging

RUN yarn lerna run build \
    && rm -rf node_modules/typescript \
        node_modules/@types \
        node_modules/@lerna \
        node_modules/lerna \
        node_modules/rxjs \
        node_modules/eslint \
        node_modules/inquirer

# copy everything else
COPY service.js /app/source/
COPY scripts /app/source/scripts
COPY packages /app/source/packages

ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
