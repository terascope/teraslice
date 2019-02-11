# teraslice-test-harness

<!-- THIS FILE IS AUTO-GENERATED, EDIT docs/packages/teraslice-test-harness/overview.md INSTEAD -->

**NOTE:** This a package within the [Teraslice](https://github.com/terascope/teraslice) monorepo, more documentation can be found [here](https://terascope.github.io/teraslice/docs/).

> A helpful library for testing teraslice jobs, operations, and other components.

**Note:** Documentation is a WIP, currently on the basic usage and description is provided.

## Installation

```sh
yarn add --dev teraslice-test-harness
```

## Available Test Harnesses

This package exports a few different test harnesses for running your operation.

**Note:** All TestHarnesses except `OpTestHarness` require a path to the asset directory so it can the test can load and fully validate multiple different operations.

### OpTestHarness

A simple test harness for running an single operation with minimal customizations. Based of the older teraslice-op-test-harness package.

**This is useful for testing Data in -> out on a Fetcher, Reader, or Processor.**

### SlicerTestHarness

A test harness for testing Operations that run on the Execution Controller, mainly the Slicer.

**This is useful for testing Slicers.**

### WorkerTestHarness

A test harness for testing Operations that run on Workers, mainly Fetchers and Processors.

**This is useful for testing Fetcher and Processors together or individually.**

### JobTestHarness

A test harness for both the Slicer and Fetcher, utilizing both the Slicer and Worker test harnesses.

**This is useful for testing Readers.**

## Builtin Operations

There a several builtin operations that are useful for writing and configuring your tests.

### Collect

**Configuration:**

- `size: number`: The target count records to collect before resolving.
- `wait: number`: Maximum time to wait before resolving the currently queued records.

**Description:** Collect data in batches. Useful for testing jobs.

### Noop

**Configuration:** N/A

**Description:** Passes the data through. Useful for testing readers.

### Delay

**Configuration:**

- `ms: number`: Milliseconds to delay before passing data through

**Description:** Wait a specific amount of time, and passes the data through.

### Test Reader

**Configuration:**

- `fetcher_data_file_path?: string`: File to path to JSON array of data records. (optional)
- `slicer_data_file_path?: string`: File to path to JSON array of slice request. (optional)

**Description:** Slice and fetch data specified in a file. Useful for testing Processors.

## Usage

See working [example asset spec](./test/example-asset-spec.ts), you can the asset bundle under test [here](./test/fixtures/asset).

**Note:** This example uses Jest but that Jest is not required to run.

```js
const path = require('path');
const SimpleClient = require('./fixtures/asset/simple-connector/client');
const {
    JobTestHarness,
    newTestJobConfig,
    newTestSlice,
    SlicerTestHarness,
    WorkerTestHarness,
} = require('teraslice-test-harness';

jest.mock('./fixtures/asset/simple-connector/client');

describe('Example Asset', () => {
    const assetDir = path.join(__dirname, 'fixtures');
    const simpleClient = new SimpleClient();
    const clientConfig = {
        type: 'simple-client',
        create: jest.fn(() => {
            return { client: simpleClient };
        }),
    };

    beforeEach(() => {
        jest.restoreAllMocks();
        clientConfig.create = jest.fn(() => {
            return { client: simpleClient };
        });
    });

    describe('using the WorkerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'transformer',
                action: 'set',
                key: 'foo',
                setValue: 'bar',
            }
        ];

        let harness;

        beforeEach(async () => {
            simpleClient.fetchRecord.mockImplementation((id) => {
                return {
                    id,
                    data: {
                        a: 'b',
                        c: 'd',
                        e: 'f',
                    }
                };
            });

            harness = new WorkerTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(1);
        });

        it('should return a list of records', async () => {
            const testSlice = newTestSlice();
            testSlice.request = { count: 10 };
            const results = await harness.runSlice(testSlice);

            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBe(true);
                expect(result).toHaveProperty('foo', 'bar');
                expect(result.data).toEqual({
                    a: 'b',
                    c: 'd',
                    e: 'f',
                });
            }
        });
    });

    describe('using the SlicerTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'simple-reader'
            },
            {
                _op: 'noop'
            }
        ];

        let harness: SlicerTestHarness;

        beforeEach(async () => {
            simpleClient.sliceRequest.mockImplementation((count) => {
                return { count, super: 'man' };
            });

            harness = new SlicerTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(1);
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

    describe('using the JobTestHarness', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
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
        ];

        let harness;

        beforeEach(async () => {
            harness = new JobTestHarness(job, {
                clients: [clientConfig],
                assetDir,
            });

            await harness.initialize();
        });

        afterEach(async () => {
            await harness.shutdown();
        });

        it('should call create client', () => {
            expect(clientConfig.create).toHaveBeenCalledTimes(2);
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

            simpleClient.isFinished.mockReturnValue(true);

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
});
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](./LICENSE) licensed.
