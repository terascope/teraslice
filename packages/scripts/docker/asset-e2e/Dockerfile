# Base image is a pre-built teraslice release. The build arg allows scripts
# to pass the exact image+tag resolved for the current test run.
ARG TERASLICE_IMAGE=ghcr.io/terascope/teraslice:dev-local-nodev24
FROM ${TERASLICE_IMAGE}

# swap-packages.js rewrites package.json dep entries to file: references
# for any dev packages mounted via TERASLICE_DEV_PACKAGES before pnpm resolves them.
# Kept in packages/scripts/scripts/ so it is easy to edit and debug locally.
COPY scripts/swap-packages.js /app/source/swap-packages.js
COPY docker/asset-e2e/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# tini is already the entrypoint in the base image; just override the command
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/entrypoint.sh"]
