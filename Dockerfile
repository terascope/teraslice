FROM node:4

RUN mkdir -p /app/src

WORKDIR /app/src

COPY package.json /app/src/
RUN npm install
COPY . /app/src

EXPOSE 5678

VOLUME /app/config /app/ops /app/jobs
