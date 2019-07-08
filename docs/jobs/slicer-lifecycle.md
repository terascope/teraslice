---
title: Slicer Lifecycle
sidebar_label: Slicer Lifecycle
---

See [SlicerOperationLifeCycle](../packages/job-components/api/interfaces/sliceroperationlifecycle.md) API for more details.

### `->initialize`

Called when the Execution Controller starts up, when this is called perform any async setup.

After recovering an execution the Slicer will be given a [`SlicerRecoveryData`](../packages/job-components/api/interfaces/slicerrecoverydata.md) for each slicer.

### `->shutdown`

Called when the Execution Controller is shutting down, when this is cleanup any open connections or destroy any in-memory state.

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
