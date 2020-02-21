FROM terascope/node-base:10.19.0-1

# [INSTALL AND BUILD PACKAGES]
ENV NODE_ENV development

COPY package.json yarn.lock lerna.json .yarnrc /app/source/

# remove the workspaces to the package.json
RUN docker-pkg-fix "pre"

# install both dev and production dependencies
RUN yarn \
    --prod=false \
    --no-progress \
    --frozen-lockfile \
    --ignore-optional

# add back the workspaces to the package.json
RUN docker-pkg-fix "post"

# Add all of the packages and other required files
COPY packages /app/source/packages

# install the missing packages
RUN yarn \
    --prod=false \
    --no-cache \
    --prefer-offline \
    --frozen-lockfile \
    --ignore-optional

COPY types /app/source/types
COPY tsconfig.json /app/source/
COPY scripts /app/source/scripts

# link and build the missing packages
RUN yarn quick:setup

# [BUILD THE PRODUCTION IMAGE]
ENV NODE_ENV production

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
