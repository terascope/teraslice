# NODE_VERSION is set by default in the config.ts, the following value will only
# be used if you build images by default with docker build
ARG NODE_VERSION=14.21.3
FROM terascope/node-base:${NODE_VERSION}

ENV NODE_ENV production

ENV YARN_SETUP_ARGS "--prod=false --silent --frozen-lockfile"

COPY package.json yarn.lock tsconfig.json .yarnrc /app/source/
COPY .yarnclean.ci /app/source/.yarnclean
COPY .yarn /app/source/.yarn
COPY packages /app/source/packages
COPY scripts /app/source/scripts
COPY types /app/source/types
COPY k8se2e /app/source/k8se2e

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

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "service.js"]
