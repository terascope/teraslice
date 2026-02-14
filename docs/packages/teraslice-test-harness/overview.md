---
title: Teraslice Test Harness
sidebar_label: Overview
---

> A helpful library for testing teraslice jobs, operations, and other components.

**Note:** Documentation is a WIP, currently on the basic usage and description is provided.

## Installation

```bash
# Using pnpm
pnpm add -D teraslice-test-harness
# Using npm
npm install --save-dev teraslice-test-harness
```

## Available Test Harnesses

This package exports a few different test harnesses for running your operation.

**Note:** All TestHarnesses can take a path to the asset directory so it can the test can load and fully validate multiple different operations, if none are specified then it will assume it is running in a [asset bundle](../../asset-bundles/development.md).

### SlicerTestHarness

A test harness for testing Operations that run on the Execution Controller, mainly [Slicers](../../jobs/types-of-operations.md#slicers).

**This is useful for testing Slicers.**

**Usage:**

```js
const {
    newTestJobConfig,
    SlicerTestHarness,
} = require('teraslice-test-harness';

describe('Example Asset (Slicer)', () => {
    const job = newTestJobConfig({
        analytics: true,
        operations: [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'noop'
            }
        ]
    });

    let harness;

    beforeEach(() => {
        harness = new SlicerTestHarness(job, {
            clients: [],
        });

        await harness.initialize();
    });

    afterEach(async () => {
        await harness.shutdown();
    });

    it('should return a list of records', async () => {
        const results = await harness.createSlices();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(10);

        for (const result of results) {
            expect(DataEntity.isDataEntity(result)).toBe(false);
            expect(result.count).toEqual(10);
            expect(result.super).toEqual('man');
        }
    });
});
```

### WorkerTestHarness

A test harness for testing Operations that run on Workers, mainly [Fetchers](../../jobs/types-of-operations.md#fetchers) and [Processors](../../jobs/types-of-operations.md#processors).

**This is useful for testing [Fetchers](../../jobs/types-of-operations.md#fetchers) and [Processors](../../jobs/types-of-operations.md#processors) together or individually.**

**Usage:**

```js
const {
    newTestJobConfig,
    newTestSlice,
    WorkerTestHarness,
} = require('teraslice-test-harness';

describe('Example Asset (Worker)', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    },
                },
            }),
        },
    ];

    describe('when given a valid job config', () => {
        const job = newTestJobConfig({
            max_retries: 2,
            analytics: true,
            operations: [
                {
                    _op: 'test-reader',
                },
                {
                    _op: 'noop',
                },
            ],
        });

        const workerHarness = new WorkerTestHarness(job, {
            clients,
        });

        beforeAll(() => workerHarness.initialize());
        afterAll(() => workerHarness.shutdown());

        it('should be able to call runSlice', async () => {
            const result = await workerHarness.runSlice(newTestSlice());
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should be able to call runSlice with just a request object', async () => {
            const result = await workerHarness.runSlice({ hello: true });
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should call slice retry', async () => {
            const onSliceRetryEvent = jest.fn();
            workerHarness.events.on('slice:retry', onSliceRetryEvent);
            const err = new Error('oh no');

            workerHarness.processors[0].handle
                .mockClear()
                .mockRejectedValueOnce(err)
                .mockRejectedValueOnce(err);

            const results = await workerHarness.runSlice({});
            expect(results).toBeArray();

            expect(onSliceRetryEvent).toHaveBeenCalledTimes(2);
            expect(workerHarness.getOperation<NoopProcessor>('noop').handle).toHaveBeenCalledTimes(3);
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await workerHarness.runSlice(newTestSlice(), {
                fullResponse: true
            });
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });
    });

    describe('when using static method testProcessor', () => {
        let harness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'noop' }, {});
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when using static method testFetcher', () => {
        let harness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testFetcher({
                _op: 'test-reader',
                passthrough_slice: true
            }, {});
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should return an instance of the test harness', () => {
            expect(harness).toBeInstanceOf(WorkerTestHarness);
        });

        it('should be able to run a slice', async () => {
            const data = [{ some: 'data' }];
            const results = await harness.runSlice(data);

            expect(results).toEqual(data);
        });
    });

    describe('when testing flush', () => {
        let harness;

        beforeAll(async () => {
            harness = WorkerTestHarness.testProcessor({ _op: 'simple-flush' }, {});
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should flush any remaining records', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush();
            expect(flushedResults).toEqual(data);
        });
    });

    describe('when testing flush with analytics', () => {
        let harness;

        beforeAll(async () => {
            const job = newTestJobConfig({
                max_retries: 0,
                analytics: true,
                operations: [
                    {
                        _op: 'test-reader',
                        passthrough_slice: true,
                    },
                    { _op: 'simple-flush' },
                ],
            });

            harness = new WorkerTestHarness(job, {});

            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should able return the result with analytics', async () => {
            const data = [{ some: 'data' }, { other: 'data' }];

            const emptyResults = await harness.runSlice(data);
            expect(emptyResults).toEqual([]);

            const flushedResults = await harness.flush({ fullResponse: true });

            expect(flushedResults).toHaveProperty('results', data);
            expect(flushedResults).toHaveProperty('status', 'flushed');
            expect(flushedResults).toHaveProperty('analytics');
            expect(flushedResults!.analytics).toContainKeys(['time', 'memory', 'size']);
        });
    });
});
```

### JobTestHarness

A test harness for both the Slicer and Fetcher, utilizing both the Slicer and Worker test harnesses.

**This is useful for testing [Readers](../../jobs/types-of-operations.md#readers).**

**Usage:**

```js
const {
    JobTestHarness,
    newTestJobConfig,
    newTestSlice,
} = require('teraslice-test-harness';

describe('Example Asset (Job)', () => {
    const job = newTestJobConfig({
        analytics: true,
        operations:
            {
                _op: 'simple-reader'
            },
            {
                _op: 'transformer',
                action: 'inc',
                key: 'scale',
                incBy: 5,
            },
            {
                _op: 'transformer',
                action: 'inc',
                key: 'scale',
                incBy: 1,
            }
        ]
    });

    let harness;

    beforeEach(async () => {
        harness = new JobTestHarness(job);

        await harness.initialize();
    });

    afterEach(async () => {
        await harness.shutdown();
    });

    it('should batches of results', async () => {
        const batches = await harness.run();

        expect(Array.isArray(batches)).toBe(true);
        expect(batches.length).toBe(10);

        for (const results of batches) {
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(true);
                expect(result.scale).toBe(6);
            }
        }
    });

    it('should be finished for the second batch of slices', async () => {
        const batches = await harness.run();

        expect(Array.isArray(batches)).toBe(true);
        expect(batches.length).toBe(10);

        for (const results of batches) {
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(true);
                expect(result.scale).toBe(6);
            }
        }
    });
});
```

### DownloadExternalAssets

Used to test processors in separate asset bundles.  It downloads a zipped asset bundle to ./test/.cache/downloads and unzips the asset to ./test/.cache/assets.  At this point assets must be in a github repository to be downloaded.

Since this is downloading additional files to the asset be sure to add `./test/.cache` to the .gitignore file in the asset bundle.

**Usage:**

To use this functionality add DownloadExternalAssets to a global setup file, ./test/global.setup.js.

global.setup.js example:
```js
const { DownloadExternalAsset } = require('teraslice-test-harness');

module.exports = async function getExternalAssets() {
    const externalAssets = new DownloadExternalAsset();

    await externalAssets.downloadExternalAsset('terascope/elasticsearch-assets@v2.2.0'); // external asset to test with
}
```

DownloadExternalAsset also accepts the asset without the version for example `await externalAssets.downloadExternalAsset('terascope/elasticsearch-assets');`.  This will downloaded the latest release, including pre-releases.  Use multiple lines to specify more than one asset.

```js
await externalAssets.downloadExternalAsset('terascope/elasticsearch-assets@v2.2.0');
await externalAssets.downloadExternalAsset('terascope/kafka-assets@v2.8.2');
```

Make sure `globalSetup: './test/global.setup.js',` is included in the `jest.config.js` file.

Example of `jest.config.js` file with the globalSetup property:

```js
'use strict';

module.exports = {
    verbose: true,
    testEnvironment: 'node',
    ...
    globalSetup: './test/global.setup.js',
};

```

If set up properly the test will start by downloading the asset specified by the global setup file then proceed onto the tests.


## Builtin Operations

Checkout these [docs](../../jobs/builtin-operations.md) for a list of built-in operations.
