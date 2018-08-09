FROM node:8
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

RUN mkdir -p /app/source
WORKDIR /app/source
COPY . /app/source/

ENV NODE_ENV production

RUN yarn global add \
    --silent \
    --no-progress \
    bunyan

RUN yarn install \
    --silent \
    --no-progress \
    --production=true

RUN yarn bootstrap:production

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "--max-old-space-size=2048", "entrypoint.js"]
