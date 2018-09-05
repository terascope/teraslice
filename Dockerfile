FROM node:8
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

ENV NODE_ENV production

RUN mkdir -p /app/source
WORKDIR /app/source

RUN yarn global add \
    --silent \
    --no-progress \
    bunyan

COPY package.json yarn.lock .yarnrc lerna.json tsconfig.json /app/source/
COPY service.js /app/source/
COPY packages /app/source/packages
COPY scripts /app/source/scripts

RUN yarn install \
    --silent \
    --no-progress \
    --pure-lockfile \
    --link-duplicates \
    && yarn setup \
    && yarn cache clean

RUN export WITH_SASL=0 && \
    yarn add -W terascope/terafoundation_kafka_connector && \
    yarn add -W terascope/teraslice_kafka_reader && \
    yarn add -W terascope/teraslice_kafka_sender

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "--max-old-space-size=2048", "service.js"]
