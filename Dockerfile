# NODE_VERSION is set by default in the config.ts, the following value will only
# be used if you build images by default with docker build
ARG NODE_VERSION=18.18.2
FROM terascope/node-base:${NODE_VERSION}

ENV NODE_ENV production

ENV YARN_SETUP_ARGS "--prod=false --silent --frozen-lockfile"

COPY package.json yarn.lock tsconfig.json .yarnrc /app/source/
COPY .yarnclean.ci /app/source/.yarnclean
COPY .yarn /app/source/.yarn
COPY packages /app/source/packages
COPY scripts /app/source/scripts
COPY types /app/source/types

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

RUN apt-get update && \
     apt-get install -y libcurl4 tini && \
       apt-get autoremove -y && \
       apt-get clean -y && \
       rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# this can most likely be removed. Looks to be related to node10->12 transition.
COPY scripts/docker-pkg-fix.js /usr/local/bin/docker-pkg-fix
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it
COPY --from=base /app /app

WORKDIR /app/source

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "import('teraslice')"
