FROM node:4
MAINTAINER Kimbro Staken

RUN mkdir -p /app/source

WORKDIR /app/source

COPY package.json /app/source/
RUN npm install
COPY . /app/source

EXPOSE 5678

VOLUME /app/config /app/logs
