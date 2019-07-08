---
title: Operation Lifecycle
sidebar_label: Lifecycle
---

## Execution Controller

See [SlicerOperationLifeCycle](../../packages/job-components/api/interfaces/sliceroperationlifecycle.md) API for more details.

### `->initialize`

Called when the Execution Controller starts up, when this is called perform any async setup.

After recovering an execution the Slicer will be given a [`SlicerRecoveryData`](../../packages/job-components/api/interfaces/slicerrecoverydata.md) for each slicer.

### `->shutdown`

Called when the Execution Controller is shutting down, when this is cleanup any open connections or destroy any in-memory state.

## Worker

See [WorkerOperationLifeCycle](../../packages/job-components/api/interfaces/workeroperationlifecycle.md) API for more details.

### `->initialize`

Called when the Execution Controller starts up, when this is called perform any async setup.

### `->shutdown`

Called when the Execution Controller is shutting down, when this is cleanup any open connections or destroy any in-memory state.
