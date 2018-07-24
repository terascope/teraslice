FROM node:8.11.3

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

VOLUME /app/config /app/logs /app/assets

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "--max-old-space-size=2048", "service.js"]
