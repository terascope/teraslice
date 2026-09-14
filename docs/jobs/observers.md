---
title: Observers
---

An `Observer` is a type of [Job API](./types-of-operations.md#apis) that only watches a job run. It is attached to the execution lifecycle and is notified as slices and operations move through the pipeline, but it never sits in the data pipeline itself and never exposes anything to the other operations in the job.

Use an Observer when you want to collect metrics, emit custom logs, track throughput, or push job progress to an external service &mdash; anything that observes the job without changing the data.

If you need to expose functionality to the operations in a job, use an [Operation API](./types-of-operations.md#operation-api) instead.

## Observer vs Operation API

Both are configured in the job's [apis](./configuration.md#apis) and both extend the same `APICore` base class. The difference is a single method:

|                                       | `OperationAPI`                     | `Observer`                  |
| ------------------------------------- | ---------------------------------- | --------------------------- |
| Implements `createAPI()`              | yes                                | no                          |
| Exposes something to other operations | yes, whatever `createAPI` resolves | no                          |
| Subscribes to lifecycle events        | yes                                | yes                         |
| File name in an asset                 | `api.js`/`api.ts`                  | `observer.js`/`observer.ts` |
| Retrieved with                        | `getAPI(name)`                     | `getObserver(name)`         |

Teraslice determines which one you wrote by checking whether the instance has a `createAPI` method &mdash; there is no flag to set. Because an Observer has no `createAPI`, it is never "created", and calling `initAPI` on one throws `Observers cannot be created`.

## Writing an Observer

An Observer subscribes to the lifecycle by defining the methods it cares about. Any method it does not define is never called, so there is no base implementation to call through to and nothing to register.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { Observer } from '@terascope/job-components';

export default class ExampleObserver extends Observer {
    async onSliceInitialized(sliceId: string): Promise<void> {
        this.logger.info(`starting slice ${sliceId}`);
    }

    async onSliceFinished(sliceId: string): Promise<void> {
        this.logger.info(`finished slice ${sliceId}`);
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Every Observer inherits the following from `APICore`:

| Property          | Description                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| `context`         | The Terafoundation [Context](../packages/job-components/api/interfaces/context/interfaces/Context.md) |
| `executionConfig` | The full [Execution Configuration](./configuration.md#job-configuration), including `operations`      |
| `apiConfig`       | The api's own entry from the job's `apis`, validated against its `Schema`                             |
| `logger`          | A logger scoped to the api's `_name`                                                                  |
| `events`          | The Terafoundation system `EventEmitter`                                                              |

It can also define `initialize()` and `shutdown()`, which the execution context calls when the job starts and stops. If you override them, call `super` so the base class logging still happens.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
async initialize(): Promise<void> {
    this._client = await createSomeClient();
    return super.initialize();
}

async shutdown(): Promise<void> {
    await this._client.close();
    return super.shutdown();
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Lifecycle events

An Observer listed in a job's `apis` is registered on **both** the "Execution Controller" and every "Worker". Which events it receives depends on where that copy is running, so a single Observer class can implement both sets and each instance will only be called for the events available where it runs.

### On the Execution Controller

These are the [Slicer Lifecycle](./slices.md#slicer-lifecycle-events) events. All are synchronous and return `void`.

| Method             | Called                                               |
| ------------------ | ---------------------------------------------------- |
| `onSliceEnqueued`  | when a slice is enqueued by the execution controller |
| `onSliceDispatch`  | when a slice is dispatched to a worker               |
| `onSliceComplete`  | when a slice is completed                            |
| `onExecutionStats` | periodically, with the current slicer statistics     |

### On a Worker

These are the [Worker Lifecycle](./slices.md#worker-lifecycle-events) events.

| Method                | Async | Called                                                             |
| --------------------- | ----- | ------------------------------------------------------------------ |
| `onSliceInitialized`  | yes   | after a slice is initialized, before it is handed to any operation |
| `onSliceStarted`      | yes   | after the slice is sent to the "Fetcher"                           |
| `onSliceFinalizing`   | yes   | after the slice is done with the last operation                    |
| `onSliceFinished`     | yes   | after the slice is acknowledged by the "Execution Controller"      |
| `onSliceFailed`       | yes   | after the slice is marked as "Failed"                              |
| `onSliceRetry`        | yes   | after an operation failed, before the slice is retried             |
| `onOperationStart`    | no    | immediately before each operation runs                             |
| `onOperationComplete` | no    | immediately after each operation ends                              |
| `onFlushStart`        | yes   | before a [flush](./slices.md#flushing) begins                      |
| `onFlushEnd`          | yes   | after a flush completes                                            |

**NOTE:** `onOperationStart` and `onOperationComplete` are synchronous and return `void`. Returning a promise from them will not be awaited, so do not do async work there. The async methods are awaited, which means slow work in them will slow down the job.

The signatures for the two per-operation hooks are:

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
onOperationStart(sliceId: string, index: number): void;

onOperationComplete(
    sliceId: string,
    index: number,
    processed: number,
    records: DataEntity[]
): void;
```
<!--END_DOCUSAURUS_CODE_TABS-->

The `index` is the position of the operation in the job's `operations` array, so `this.executionConfig.operations[index]._op` gives you its name.

## Adding an Observer to an asset

Within an asset bundle an Observer lives in its own directory, in a file named `observer.js`/`observer.ts`, alongside a `schema.js`/`schema.ts`:

```txt
asset/
└── example_observer/
    ├── observer.ts
    └── schema.ts
```

- The `Schema` is **required** and validates the api's entry in the job's `apis`.
- A directory may contain an `api.js` or an `observer.js`, but **not both**. Including both fails to load with `required only one api.js or observer.js`.
- The directory name is the api's name, and is what you reference as `_name` in the job.

## Configuring an Observer on a job

An Observer is added to the [apis](./configuration.md#apis) array, not to `operations`:

```json
{
    "name": "Example Job",
    "lifecycle": "once",
    "assets": [
        "elasticsearch",
        "example-asset"
    ],
    "apis": [
        {
            "_name": "example_observer"
        }
    ],
    "operations": [
        { "_op": "elasticsearch_reader", "index": "events-*" },
        { "_op": "noop" }
    ]
}
```

Like any api, you can run several instances of the same Observer by tagging the name:

```json
{
    "apis": [
        { "_name": "example_observer:first" },
        { "_name": "example_observer:second" }
    ]
}
```

## Reading an Observer from an operation

An Observer cannot be fetched with `getAPI`, since it never creates one. Use `getObserver` to get the instance itself, which lets an operation read whatever state the Observer has accumulated:

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { BatchProcessor, DataEntity } from '@terascope/job-components';
import ExampleObserver from '../example_observer/observer.js';

export default class ExampleProcessor extends BatchProcessor {
    async onBatch(dataEntities: DataEntity[]): Promise<DataEntity[]> {
        const observer = this.context.apis.executionContext
            .getObserver<ExampleObserver>('example_observer');

        this.logger.info(`seen ${observer.recordCount} records so far`);
        return dataEntities;
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## Example: tracking throughput

A complete Observer that counts records per operation and logs the throughput of the job.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { Observer, DataEntity } from '@terascope/job-components';

export default class ThroughputObserver extends Observer {
    recordCount = 0;

    private _sliceStart = 0;

    async onSliceInitialized(sliceId: string): Promise<void> {
        this._sliceStart = Date.now();
    }

    // NOTE: this is NOT an async function and should not return anything.
    onOperationComplete(
        sliceId: string,
        index: number,
        processed: number,
        records: DataEntity[]
    ): void {
        const opName = this.executionConfig.operations[index]._op;
        this.logger.trace(`operation ${opName} processed ${processed} records for slice ${sliceId}`);

        // only count what came out of the last operation
        if (index === this.executionConfig.operations.length - 1) {
            this.recordCount += processed;
        }
    }

    async onSliceFinished(sliceId: string): Promise<void> {
        const elapsed = Date.now() - this._sliceStart;
        this.logger.info(`slice ${sliceId} took ${elapsed}ms, ${this.recordCount} records total`);
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

Its schema, which validates the api's configuration:

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import { BaseSchema } from '@terascope/job-components';

export default class Schema extends BaseSchema<Record<string, any>> {
    build(): Record<string, any> {
        return {};
    }
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

## The built-in JobObserver

Teraslice ships with its own Observer, `JobObserver`, which is registered on every worker before any api from the job. It is what implements the `analytics` option on the [Job Configuration](./configuration.md#job-configuration): it records the time and heap usage around each operation in `onOperationStart`/`onOperationComplete` and exposes the totals through `getAnalytics()`.

It is a good reference for how to write a per-operation Observer. See the [API docs](../packages/job-components/api/operations/job-observer/classes/default.md) for details.

## Testing an Observer

Add the Observer to the test job's `apis` and use the [WorkerTestHarness](../packages/teraslice-test-harness/api/worker-test-harness/classes/default.md). Running a slice fires the lifecycle events, and `getOperationAPI` returns the Observer instance so you can assert against its state.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
import path from 'node:path';
import { WorkerTestHarness } from 'teraslice-test-harness';
import { newTestJobConfig } from '@terascope/job-components';
import ThroughputObserver from '../asset/example_observer/observer.js';

describe('ThroughputObserver', () => {
    const job = newTestJobConfig({
        apis: [{ _name: 'example_observer' }],
        operations: [
            { _op: 'test-reader', passthrough_slice: true },
            { _op: 'noop' },
        ],
    });

    // `assetDir` must point at the directory containing your `asset` directory,
    // otherwise the harness cannot find the observer to load.
    const harness = new WorkerTestHarness(job, {
        assetDir: path.join(import.meta.dirname, '..'),
    });

    beforeAll(() => harness.initialize());
    afterAll(() => harness.shutdown());

    it('should count the records it sees', async () => {
        const observer = harness.getOperationAPI<ThroughputObserver>('example_observer');
        expect(observer.recordCount).toEqual(0);

        await harness.runSlice([{ id: 1 }, { id: 2 }]);
        expect(observer.recordCount).toEqual(2);

        await harness.runSlice([{ id: 3 }]);
        expect(observer.recordCount).toEqual(3);
    });
});
```
<!--END_DOCUSAURUS_CODE_TABS-->

Check out the [API docs](../packages/job-components/api/operations/observer/overview.md) for more details.
