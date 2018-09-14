FROM node:8.12
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

ENV NODE_ENV production
ENV NPM_CONFIG_LOGLEVEL error

RUN mkdir -p /app/source
WORKDIR /app/source

RUN export WITH_SASL=0 && \
    yarn global add \
    --silent \
    --no-progress \
    --no-emoji \
    --no-cache \
    bunyan \
    terascope/terafoundation_kafka_connector \
    terascope/teraslice_kafka_reader \
    terascope/teraslice_kafka_sender

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

COPY .yarnrc /app/source

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml
