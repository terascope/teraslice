---
title: Scripts
sidebar_label: Overview
---

> A collection of terascope monorepo scripts

## Installation

```bash
# Using yarn
yarn global add @terascope/scripts
# Using npm
npm install --global @terascope/scripts
```


## Test Runner
Many tests require the use of various database's for testing. Built into the test framework we provide the means to test against supported databases including elasticsearch, opensearch, kafka, minio(S3) and rabbitmq.

To enable these databases into the tests include the appropriate environmental variables to the test scripts in the package.json

Example:
```
"test": "TEST_ELASTICSEARCH='true' ts-scripts test . --",
"test:elasticsearch7": "TEST_ELASTICSEARCH='true' ELASTICSEARCH_VERSION='7.9.3' ts-scripts test . --",
```

In the above example, we specify `TEST_ELASTICSEARCH` which alerts the test harness to setup and wait for an elasticsearch instance to be available before any tests are run. It defaults to `v6.8.6` which can be overridden by the `ELASTICSEARCH_VERSION` variable

All defaults and variables that are used can be found at `/packages/scripts/src/helpers/config.ts` file. These values are exported and a few of them are set in the test process environment for client setup.

Multiple databases can be setup at the same time by using the correct environmental variables

```
"test": "TEST_ELASTICSEARCH='true' TEST_KAFKA='true' ts-scripts test --suite e2e --",
```

In the above scenario, both elasticsearch and kafka are setup before the tests are run

List of environmental variables to setup a database:

- "TEST_ELASTICSEARCH"
- "TEST_OPENSEARCH"
- "TEST_KAFKA"
- "TEST_MINIO"
- "TEST_RESTRAINED_OPENSEARCH" (this contains bulk queue limits to test api bulk overflows)
- "TEST_RESTRAINED_ELASTICSEARCH" (this contains bulk queue limits to test api bulk overflows)
- "TEST_RABBITMQ"
