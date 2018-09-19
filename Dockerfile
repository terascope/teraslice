FROM terascope/teraslice-base:v0.1.3

COPY package.json yarn.lock /app/source/

RUN yarn --frozen-lockfile --link-duplicates

COPY lerna.json tsconfig.json service.js /app/source/
COPY types /app/source/types
COPY packages /app/source/packages
COPY scripts /app/source/scripts

RUN yarn bootstrap:prod && yarn build && rm -rf node_modules/typescript

ENV NODE_OPTIONS "--max-old-space-size=2048"

CMD ["node", "service.js"]
