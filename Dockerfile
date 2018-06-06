FROM node:8
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source
WORKDIR /app/source
COPY package.json yarn.lock /app/source/

RUN yarn global add \
    --silent \
    --no-progress \
    bunyan

RUN yarn install \
    --silent \
    --no-progress \
    --production=true

COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs

ENV TERAFOUNDATION_CONFIG /app/config/processor-master.yaml 

CMD ["node", "--max-old-space-size=2048", "service.js"]
