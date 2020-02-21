FROM terascope/node-base:10.19.0-1

# [INSTALL AND BUILD PACKAGES]
ENV NODE_ENV development

COPY package.json yarn.lock lerna.json /app/source/
COPY .docker.yarnrc /app/source/.yarnrc

# Add all of the packages and other required files
COPY packages /app/source/packages

# COPY the yarn offline cache
COPY .yarn-offline-cache /app/source/.yarn-offline-cache

# install the missing packages
RUN yarn \
    --prod=false \
    --silent \
    --no-cache \
    --offline \
    --frozen-lockfile \
    --ignore-optional

COPY types /app/source/types
COPY tsconfig.json /app/source/
COPY scripts /app/source/scripts

# [BUILD THE PRODUCTION IMAGE]
ENV NODE_ENV production

# link and build the missing packages
RUN yarn quick:setup

# Create a smaller build
RUN rm -rf .yarn-offline-cache/*.tar.gz

COPY service.js /app/source/

# verify node-rdkafka is installed right
RUN node -e "require('node-rdkafka')"

# verify teraslice is installed right
RUN node -e "require('teraslice')"

EXPOSE 5678

# set up the volumes
VOLUME /app/config /app/logs /app/assets
ENV TERAFOUNDATION_CONFIG /app/config/teraslice.yaml

CMD ["yarn", "node", "service.js"]
