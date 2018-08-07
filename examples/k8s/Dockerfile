# Replace with your pre-built of the teraslice-worker
FROM teraslice-worker AS worker

# Use teraslice as the base image
FROM teraslice

WORKDIR /app/source

# Copy worker to /app/source
COPY --from=worker /app/source /app/source/worker

# Copy entrypoint to dynamically switch between Teraslice Worker and Teraslice
COPY ./entrypoint.js /app/source/entrypoint.js

# Install any terafoundation connectors
# RUN yarn add \
#     --silent \
#     --no-progress \
#     terafoundation_kafka_connector

CMD ["node", "--max-old-space-size=2048", "entrypoint.js"]
