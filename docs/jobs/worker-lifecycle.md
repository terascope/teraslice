---
title: Worker Lifecycle
sidebar_label: Worker Lifecycle
---

See [WorkerOperationLifeCycle](../packages/job-components/api/interfaces/workeroperationlifecycle.md) API for more details.

### `->initialize`

Called when the Worker starts up, when this is called perform any async setup.

### `->shutdown`

Called when the Worker is shutting down, when this is cleanup any open connections or destroy any in-memory state.

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

**NOTE:** A retry can be stopped by throw any error inside this function.

### `->onOperationStart`

Called immediately before an operation is started

### `->onOperationComplete`

Called immediately after an operation has ended

### `->onFlushStart`

Called to notify the processors that the next slice being
passed through will be an empty slice used to flush
any additional in-memory state.

### `->onFlushEnd`

Called to notify the processors that the slice is finished being flushed
(shutdown will likely be called immediately afterwards)
