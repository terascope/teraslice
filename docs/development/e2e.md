---
title: End-to-End Tests
---

> Teraslice End-to-End Test Suite

## Dependencies

- Docker (not sure about minimal version but tested with 17.06.1-ce-rc1)
- Docker Compose (not sure about minimal version but tested with 1.14.0)

## General Notes

Unless specified, all commands are assumed to be run from this e2e tests
directory - utils like `docker-compose` look for files in current dir.

You can run `pnpm test` from the directory to run the tests.

## Development

When in dev mode, the teraslice project root will be built in a docker container, including any uncommitted changes. Currently this e2e tests do not support symlinked directories. The recommended workflow is:

1. From the teraslice project root, `pnpm run setup` and it will link the teraslice packages together

2. From the e2e directory, `pnpm test` will run
   the test suite against latest stable versions.

3. Repeat as needed. When done, run `pnpm clean` from this directory.

## CI Tests

When in CI, the teraslice tests will run until a failure happens then bail, output the logs, and cleanup the docker stack. To run in CI tests, use `pnpm test:ci` from inside the e2e directory from inside the project root. Running the CI tests will also force downloading assets.

## Assets

Currently only the `elasticsearch-assets` and `kafka-assets` are automatically downloaded to the latest bundle and loaded into `${root}/e2e/autoload` when the tests are ran. When downloading it will delete any older assets in order to prevent loading two different versions of the same asset.

To add additionally asset bundles, edit `${root}/e2e/test/download-assets.js`.

## Trouble-Shooting

The environment is managed by `docker-compose`. See the `ps` & `log`
sub-commands to diagnose potential issues in the containers. Here is a recipe to
prettify the teraslice logs:

```sh
# from this directory
pnpm logs
# if you want to follow the logs use:
pnpm logs-follow
```

## Notes

- Teraslice will attempt to listen on port `45678`, make sure to stop an local instance to prevent port collisions

- The port for docker's opensearch instance listens on `49200`, so you can check it at `localhost:49200`
