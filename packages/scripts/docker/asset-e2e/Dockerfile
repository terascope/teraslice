# Base image is a pre-built teraslice release. The build arg allows scripts
# to pass the exact image+tag resolved for the current test run.
ARG TERASLICE_IMAGE=ghcr.io/terascope/teraslice:dev-local-nodev24
FROM ${TERASLICE_IMAGE}

# The production base image keeps /app/source root-owned (read-only to the
# unprivileged user). This image rewrites package.json and runs
# `pnpm run setup` in that tree, so re-grant write access to the app user here.
USER root
RUN chown -R 10001:apps /app/source

# The base image runs as the unprivileged '10001' user, so copy files with
# explicit ownership and set the executable bit at copy time.
# swap-packages.js rewrites package.json dep entries to file: references
# for any dev packages mounted via TERASLICE_DEV_PACKAGES before pnpm resolves them.
# Kept in packages/scripts/scripts/ so it is easy to edit and debug locally.
COPY --chown=10001:apps scripts/swap-packages.js /app/source/swap-packages.js
COPY --chown=10001:apps --chmod=0755 docker/asset-e2e/entrypoint.sh /app/entrypoint.sh

# Drop back to the unprivileged user for runtime
USER 10001

# tini is already the entrypoint in the base image; just override the command
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/entrypoint.sh"]
