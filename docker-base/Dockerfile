FROM node:8.12
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL error

RUN mkdir -p /app/source
WORKDIR /app/

RUN yarn global add \
    --silent \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan

COPY package.json yarn.lock /app/

RUN export WITH_SASL=0 && yarn \
    --silent \
    --no-progress \
    --no-emoji \
    --no-cache

WORKDIR /app/source

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

COPY .yarnrc /app/source

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
