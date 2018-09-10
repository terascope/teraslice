FROM terascope/teraslice-base:v0.1.1

COPY package.json yarn.lock /app/source/

RUN yarn --frozen-lockfile --link-duplicates

COPY lerna.json tsconfig.json service.js /app/source/
COPY packages /app/source/packages
COPY scripts /app/source/scripts

RUN yarn bootstrap:prod && yarn build && rm -rf node_modules/typescript

ENV MAX_OLD_SPACE_SIZE 2048

CMD ["node", "--max-old-space-size=${MAX_OLD_SPACE_SIZE}", "service.js"]
