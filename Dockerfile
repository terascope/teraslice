FROM terascope/node-base:12.22.1

ENV NODE_ENV production

ENV YARN_SETUP_ARGS "--prod=false --silent --frozen-lockfile"

COPY package.json yarn.lock tsconfig.json .yarnrc /app/source/
COPY .yarnclean.ci /app/source/.yarnclean
COPY packages /app/source/packages
COPY scripts /app/source/scripts

RUN yarn --prod=false --silent --ignore-optional --frozen-lockfile \
    && yarn cache clean

COPY types /app/source/types

RUN yarn build

COPY service.js /app/source/

# Create a smaller build
RUN yarn \
    --prod=true \
    --silent \
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

CMD ["node", "service.js"]
