FROM node:8
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

ENV NODE_ENV production

RUN mkdir -p /app/source
WORKDIR /app/source
COPY package.json yarn.lock /app/source/

RUN yarn install \
    --silent \
    --no-progress \
    --production=true

COPY entrypoint.js lerna.json examples /app/source/ 
COPY packages /app/source/packages

RUN yarn bootstrap:production

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "--max-old-space-size=2048", "entrypoint.js"]