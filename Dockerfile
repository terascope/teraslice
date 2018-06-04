FROM node:8
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source
WORKDIR /app/source
COPY package.json yarn.lock /app/source/

RUN yarn global add bunyan
RUN yarn install --no-progress --production=true

COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs

ENTRYPOINT ["node", "service.js"]
