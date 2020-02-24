FROM terascope/node-base:10.19.0-1

ENV NODE_ENV production

ENV YARN_SETUP_ARGS "--prod=false --silent --offline --frozen-lockfile"

COPY package.json yarn.lock lerna.json tsconfig.json /app/source/
COPY .docker.yarnrc /app/source/.yarnrc
COPY packages /app/source/packages
COPY .yarn-offline-cache /app/source/.yarn-offline-cache
COPY types /app/source/types
COPY scripts /app/source/scripts
COPY service.js /app/source/

RUN yarn setup

# Create a smaller build
RUN rm -rf .yarn-offline-cache/*.tar.gz \
    && yarn \
    --prod=true \
    --silent \
    --offline \
    --frozen-lockfile \
    --skip-integrity-check \
    --ignore-scripts \
    && yarn cache clean

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["yarn", "node", "service.js"]
