FROM node:4
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source

WORKDIR /app/source

RUN npm install bluebird@^2.9.34 \
    body-parser@^1.15.2 \
    convict@^1.0.1 \
    datemath-parser@^1.0.5 \
    decompress@^4.1.0 \
    easy-table@^1.0.0 \
    elasticsearch_api@terascope/elasticsearch_api \
    express@^4.13.3 \
    fs-extra@^3.0.1 \
    jasmine@^2.3.2 \
    lodash@^4.13.1 \
    mocker-data-generator@^1.2.2 \
    moment@^2.15.1 \
    queue@terascope/queue \
    request@^2.81.0 \
    shortid@^2.2.6 \
    socket.io@^1.4.5 \
    socket.io-client@^1.4.5 \
    terafoundation@terascope/terafoundation \
    uuid@^2.0.1 \
    yargs@^3.18.0

COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs
