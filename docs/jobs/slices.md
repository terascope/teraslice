---
title: Slices
---

Slices are like heartbeats within teraslice, each heartbeat tracks metadata around the work being down.

A Slice request is created by the [Slicer](./types-of-operations.md#Slicers) and the Execution Controller wraps the request with [Slice Metadata](#slice-metadata) stored in the state store in Teraslice and distributes the slice to the available Workers.

## Slice Metadata

```js
{
    // unique slice uuid
    slice_id: 'd994d423-f3a3-411d-8973-4a4ccccd1afd',
    // id (or index) of the slicer that created the slice
    slicer_id: 0,
    // the current incremented count of slices created
    slicer_order: 10,
    // the data created via the Slicer
    request: { foo: 'bar' }
}
```

## Slicer Lifecycle Events

A [Slicer](./types-of-operations.md#Slicers) can handle the following events:

### `->onSliceEnqueued`

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices enqueued by the execution controller

### `->onSliceDispatch`

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices disptached by the execution controller

### `->onSliceComplete`

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices completed by the execution controller

### `->onExecutionStats`

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track various slicer satistics

See [SlicerOperationLifeCycle](../packages/job-components/api/interfaces/interfaces_operation_lifecycle.SlicerOperationLifeCycle.md) API for more details.

## Worker Lifecycle Events

### `->onSliceInitialized`

Called after a slice is initializated, but before the slice has been handed to any operation.

### `->onSliceStarted`

Called after a the slice is sent to the "Fetcher"

### `->onSliceFinalizing`

Called after a slice is done with the last operation in the execution

### `->onSliceFinished`

Called after the slice has been acknowledged by the "Execution Controller"

### `->onSliceFailed`

Called after the slice has been marked as "Failed"

### `->onSliceRetry`

Called after the operation failed to process the slice but before the slice is retried.

**NOTE:** A retry can be stopped by throwing any error inside this function.

### `->onOperationStart`

Called immediately before an operation is started

### `->onOperationComplete`

Called immediately after an operation has ended

### `->onFlushStart`

Called to notify the processors that the next slice being
passed through will be an empty slice used to flush
any additional in-memory state. See [Flushing](#flushing).

### `->onFlushEnd`

Called to notify the processors that the slice is finished being flushed
(shutdown will likely be called immediately afterwards). See [Flushing](#flushing).

See [WorkerOperationLifeCycle](../packages/job-components/api/interfaces/interfaces_operation_lifecycle.WorkerOperationLifeCycle.md) API for more details.

## Flushing

A "flush" is an event used to persist any in-memory state or to push any additional data through the pipeline. This is currently only done on shutdown but that may change. Before a "flush" starts the [onFlushStart](#-onFlushStart) is called. Then the previously known "slice" is passed through the pipeline, at that time the processors should persist or pass-along their in-memory state. When the "flush" completes, [onFlushEnd](#-onFlushEnd) is called. The flush always happens before `shutdown` is called.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```ts
export default class ExampleProcessor extends BatchProcessor {
    private _collectedData: DataEntity[] = [];
    private _flushing: boolean = false;

    // ...
    async onBatch(data) {
        if (this._flushing) {
            return this._collectedData;
        }

        this._collectedData = this._collectedData.concat(data);
        return data;
    }

    onFlushStart() {
        this._flushing = true;
    }

    onFlushEnd() {
        this._flushing = false;
    }
    // ...
}
```
<!--END_DOCUSAURUS_CODE_TABS-->
