# Testing Operations

Teraslice ships `teraslice-test-harness` for exercising operations in-process without a real cluster. Tests live at `test/<operation_name>/` and use the `*-spec.ts` naming convention. Copy the structure of a sibling test in the target bundle.

- `WorkerTestHarness` — for processors and fetchers (the worker pipeline).
- `SlicerTestHarness` — for slicers (the execution-controller side).

## Processor test

```ts
import 'jest-extended';
import { DataEntity } from '@terascope/core-utils';
import { OpConfig } from '@terascope/job-components';
import { WorkerTestHarness } from 'teraslice-test-harness';

describe('my_operation', () => {
    let harness: WorkerTestHarness;

    async function makeTest(config: Partial<OpConfig> = {}) {
        const opConfig = Object.assign({ _op: 'my_operation' }, config);
        harness = WorkerTestHarness.testProcessor(opConfig);
        await harness.initialize();
        return harness;
    }

    afterEach(async () => {
        if (harness) await harness.shutdown();
    });

    it('sets the field', async () => {
        const test = await makeTest({ field: 'foo', value: 'bar' });
        const results = await test.runSlice([{ id: 1 }]);

        expect(results[0]).toEqual({ id: 1, foo: 'bar' });
    });
});
```

`runSlice(data)` pushes an array of records through the operation and returns the output records. Pass `[]` to assert empty-input behavior.

## Reader test (fetcher + slicer)

Use `WorkerTestHarness.testFetcher(opConfig)` for the fetcher, and `SlicerTestHarness` for the slicer:

```ts
import { SlicerTestHarness } from 'teraslice-test-harness';

const harness = new SlicerTestHarness(job, { /* clients */ });
await harness.initialize();
const slices = await harness.createSlices();
```

Build the `job` with the op as the reader; `createSlices()` returns one round of slices from the slicer.

## Schema test

Assert that invalid configs throw and defaults resolve:

```ts
it('rejects a missing required field', async () => {
    await expect(makeTest({})).rejects.toThrow();
});
```

## Running

**Run through `ts-scripts`, not bare `jest`.** The bundles are ESM; `ts-scripts` sets up the ESM jest config for you. A bare `pnpm exec jest ...` dies at load time with `SyntaxError: Cannot use import statement outside a module` on the first `@terascope/*` import.

```bash
pnpm test                                          # whole suite (wraps ts-scripts + jest)
pnpm exec ts-scripts test asset -- --testPathPatterns="my_operation"   # one operation
```

Note `--testPathPatterns` is **plural** (current jest). Everything after `--` is forwarded to jest.

Some bundles' integration tests require Docker (e.g. OpenSearch/Elasticsearch or Kafka containers). Pure transform operations (map/filter/each) usually test without any external service.

## Gotchas

- **`rejectRecord` throws by default.** A record sent to `rejectRecord` is handled per the job's `_dead_letter_action`, which defaults to `throw`. So an operation that rejects records will throw during the slice unless the op config sets `_dead_letter_action` to `'none'`, `'log'`, or a dead-letter-queue API name. To test the *drop* path, pass `_dead_letter_action: 'none'` in the opConfig; to test the *throw* path, use the default and assert `rejects.toThrow(...)`.

- **Don't assume a mocked `Math.random()` sequence lines up 1:1 with records.** The harness/framework may draw from `Math.random()` before your operation runs, so a `mockImplementation` feeding a fixed sequence can be offset by a record. For deterministic tests use `jest.spyOn(Math, 'random').mockReturnValue(<constant>)` and assert on counts (e.g. "all dropped" / "all kept") rather than which specific records survived.

- **Results are `DataEntity` instances, not plain objects.** `toEqual({...})` matches a `DataEntity` against a plain object by enumerable properties, but if you need to be strict, compare against what the harness returns. `runSlice([])` (empty input) is the standard way to assert empty-input behavior.
