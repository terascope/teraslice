# Build connectors
FROM node:8 as connectors

RUN mkdir -p /app
WORKDIR /app

RUN yarn init -y && \
    yarn add --no-cache --no-lockfile --silent --no-progress --link-duplicates --production \
    terascope/terafoundation_kafka_connector \
    terascope/teraslice_kafka_reader \
    terascope/teraslice_kafka_sender \
    && rm package.json

# Build node_modules from yarn.lock
FROM node:8 as node_modules

RUN mkdir -p /app/source
WORKDIR /app/source

COPY .yarnrc.prod /app/source/.yarnrc

COPY package.json yarn.lock /app/source/

RUN yarn --no-cache --frozen-lockfile --link-duplicates

# Build packages next
FROM node:8

ENV NODE_ENV production
ENV MAX_OLD_SPACE_SIZE 2048

RUN mkdir -p /app/source
WORKDIR /app/source

RUN yarn global add bunyan

COPY --from=connectors /app/node_modules /app/node_modules
COPY --from=node_modules /app/source /app/source

COPY .yarnrc.prod /app/source/.yarnrc.prod

COPY lerna.json tsconfig.json service.js /app/source/
COPY packages /app/source/packages
COPY scripts /app/source/scripts

RUN yarn bootstrap:prod && yarn build && rm -rf node_modules/typescript

CMD ["node", "--max-old-space-size=${MAX_OLD_SPACE_SIZE}", "service.js"]
