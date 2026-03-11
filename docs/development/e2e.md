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

## Logging

E2e tests span two separate runtime environments, each with its own signale instance and logging behavior. Understanding this boundary is important when adding or debugging log output.

### The two environments

**ts-scripts process** — the orchestration layer that builds the Docker image, starts services, and spawns Jest. Its signale instance is defined in `packages/scripts/src/helpers/signale.ts`:

```ts
logLevel: isTest ? 'error' : 'info'
```

`isTest` is `process.env.NODE_ENV === 'test'`. When ts-scripts runs its own unit tests it becomes `'error'`, but during a normal `pnpm test --suite e2e` invocation `NODE_ENV` is not `'test'` in the ts-scripts process, so `logLevel` is `'info'`.

**e2e/Jest process** — the child process spawned by ts-scripts that runs all files under `e2e/test/`. Its signale instance is defined in `e2e/test/signale.ts`:

```ts
logLevel: 'info'
```

This is hardcoded and does not change, even though Jest sets `NODE_ENV=test` in the child process. This is intentional: it means e2e test code can use `signale.info()`, `signale.warn()`, etc. unconditionally and the output will always be visible.

### Why scripts debug calls are silent by default

Inside ts-scripts, there are two kinds of debug output:

1. **`signale.debug()` calls with explicit guards** — Many calls are wrapped in `if (debug)` or `if (options.debug || options.trace || isCI)`. These only execute when `--debug` is passed.

2. **`debugLogger` calls** (`const logger = debugLogger('ts-scripts:...')`) — These use the `debug` npm package under the hood. Output is only produced when the `DEBUG` environment variable matches the namespace (e.g. `DEBUG='*teraslice*'`). Without `DEBUG` set, all `logger.debug()`, `logger.info()`, and even `logger.warn()` calls from `debugLogger` are completely silent.

### What `--debug` enables

Passing `--debug` to ts-scripts (e.g. `pnpm test --suite e2e --debug`) does three things:

1. **Removes `--silent` from Jest** and adds `--runInBand` (sequential execution).
2. **Sets `DEBUG='*teraslice*'`** in the child Jest environment, enabling all `debugLogger` namespaces that start with `teraslice:`.
3. **Sets `DEBUG_LOG_LEVEL='debug'`** in the child Jest environment.

The `DEBUG` and `DEBUG_LOG_LEVEL` variables are forwarded only to the spawned Jest process, not back to the ts-scripts process itself.

### Terafoundation logs inside containers

The Teraslice processes running inside Docker containers use a Bunyan-based logger configured in `e2e/test/setup-config.ts`:

```ts
log_level: [
    { console: 'warn' },
    { file: DEBUG_LOG_LEVEL || 'info' }
]
```

- **Console output** from containers is always at `'warn'` level — only warnings and errors appear in container stdout/stderr.
- **File output** defaults to `'info'`. When `--debug` is passed, `DEBUG_LOG_LEVEL='debug'` is forwarded into the container environment and file logs become `'debug'`-level.
- File logging is only active when `FILE_LOGGING=true`, which ts-scripts sets via the `--logs` flag.

To view file logs from a running e2e run, use:

```sh
# from the e2e directory
pnpm logs
pnpm logs-follow
```

### Adding new log calls in e2e code

- In **`e2e/test/`**: use the e2e signale directly. `signale.info()` / `.warn()` / `.error()` are always visible. `signale.debug()` calls for the custom `debug` type may be filtered depending on signale's logLevel. Prefer `signale.info()` for anything that should always appear during a test run.
- In **`packages/scripts/src/`**: wrap any `signale.debug()` call that should only appear in debug mode with an explicit `if (debug)` guard. For `debugLogger` calls, output is only visible when `DEBUG=*teraslice*` is set (i.e. when `--debug` is passed).

## Notes

- Teraslice will attempt to listen on port `45678`, make sure to stop an local instance to prevent port collisions

- The port for docker's opensearch instance listens on `49200`, so you can check it at `localhost:49200`
