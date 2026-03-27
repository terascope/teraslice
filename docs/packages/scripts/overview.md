---
title: Scripts
sidebar_label: Overview
---

> A collection of terascope monorepo scripts

## Installation

```bash
# Using pnpm
pnpm add -g @terascope/scripts
# Using npm
npm install --global @terascope/scripts
```


## Test Runner
Many tests require the use of various database's for testing. Built into the test framework we provide the means to test against supported databases including opensearch, kafka, minio(S3) and rabbitmq.

To enable these databases into the tests include the appropriate environmental variables to the test scripts in the package.json

Example:
```
"test": "TEST_OPENSEARCH='true' ts-scripts test . --",
"test:opensearch2": "TEST_OPENSEARCH='true' OPENSEARCH_VERSION='2.15.0' ts-scripts test . --",
```

In the above example, we specify `TEST_OPENSEARCH` which alerts the test harness to setup and wait for an opensearch instance to be available before any tests are run. It defaults to `v2.15.0` which can be overridden by the `OPENSEARCH_VERSION` variable

All defaults and variables that are used can be found at `/packages/scripts/src/helpers/config.ts` file. These values are exported and a few of them are set in the test process environment for client setup.

Multiple databases can be setup at the same time by using the correct environmental variables

```
"test": "TEST_OPENSEARCH='true' TEST_KAFKA='true' ts-scripts test --suite e2e --",
```

In the above scenario, both opensearch and kafka are setup before the tests are run

List of environmental variables to setup a database:

- "TEST_OPENSEARCH"
- "TEST_KAFKA"
- "TEST_MINIO"
- "TEST_RESTRAINED_OPENSEARCH" (this contains bulk queue limits to test api bulk overflows)
- "TEST_RABBITMQ"
- "TEST_TERASLICE"

## Asset E2E Testing with Teraslice

Setting `TEST_TERASLICE=true` enables e2e testing of assets against a live Teraslice instance. When enabled, the test harness will:

1. Start an OpenSearch instance (required by Teraslice)
2. Fetch the latest Teraslice image from GHCR for the current Node.js major version (or use a pinned image via `TERASLICE_IMAGE`)
3. Start a Teraslice container configured to connect to the OpenSearch and any other services in the test suite
4. Wait for the Teraslice API to become healthy before running tests

The `TERASLICE_HOST` environment variable is set automatically and made available to tests for connecting to the Teraslice API.

Example `package.json` test script for an asset:

```json
"test:e2e": "ASSET_ZIP_PATH=$(ls ./build/*.zip | head -1) TEST_TERASLICE=true ts-scripts test -- --testPathPatterns=test/e2e"
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `TEST_TERASLICE` | Start a Teraslice instance for testing | `false` |
| `TERASLICE_IMAGE` | Pin a specific Teraslice Docker image (e.g. `ghcr.io/terascope/teraslice:v3.4.2-nodev24.14.0`). If not set, the latest release is fetched from GitHub. | `null` |
| `TERASLICE_PORT` | Port to expose Teraslice on the host | `45678` |
| `ASSET_ZIP_PATH` | Path to the built asset `.zip` file to upload during tests | `null` |
