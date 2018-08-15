FROM node:8
LABEL MAINTAINER Terascope, LLC <info@terascope.io>

RUN mkdir -p /app/source
WORKDIR /app/source

RUN yarn config set silent && \
    yarn config set no-progress && \
    yarn config set pure-lockfile && \
    yarn config set prefer-offline

RUN yarn global add bunyan

COPY package.json yarn.lock .yarnrc lerna.json tsconfig.json /app/source/
RUN yarn install

COPY service.js /app/source/
COPY packages /app/source/packages
COPY scripts /app/source/scripts

# Install and build dependecies
RUN yarn bootstrap --loglevel=error --no-progress \
    && yarn build --loglevel=error --no-progress

ENV NODE_ENV production

EXPOSE 5678

VOLUME /app/config /app/logs /app/assets

ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["node", "--max-old-space-size=2048", "service.js"]
