---
title: Job Components: `SlicerOperationLifeCycle`
sidebar_label: SlicerOperationLifeCycle
---

# Interface: SlicerOperationLifeCycle

## Hierarchy

* [OperationLifeCycle](operationlifecycle.md)

  * **SlicerOperationLifeCycle**

## Implemented by

* [ParallelSlicer](../classes/parallelslicer.md)
* [Slicer](../classes/slicer.md)
* [SlicerCore](../classes/slicercore.md)
* [SlicerExecutionContext](../classes/slicerexecutioncontext.md)
* [TestSlicer](../classes/testslicer.md)

### Index

#### Methods

* [initialize](sliceroperationlifecycle.md#initialize)
* [onExecutionStats](sliceroperationlifecycle.md#optional-onexecutionstats)
* [onSliceComplete](sliceroperationlifecycle.md#optional-onslicecomplete)
* [onSliceDispatch](sliceroperationlifecycle.md#optional-onslicedispatch)
* [onSliceEnqueued](sliceroperationlifecycle.md#optional-onsliceenqueued)
* [shutdown](sliceroperationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`recoveryData?`: *[SlicerRecoveryData](slicerrecoverydata.md)[]*): *`Promise<void>`*

*Overrides [OperationLifeCycle](operationlifecycle.md).[initialize](operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:93](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L93)*

Called during execution initialization,
when this is cleanup any open connections or cleanup any in-memory state.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | [SlicerRecoveryData](slicerrecoverydata.md)[] | is the data to recover from (one for each slicer)  |

**Returns:** *`Promise<void>`*

___

### `Optional` onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](executionstats.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:117](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L117)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track various slicer satistics

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](executionstats.md) |

**Returns:** *void*

___

### `Optional` onSliceComplete

▸ **onSliceComplete**(`result`: *[SliceResult](sliceresult.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:111](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L111)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices completed by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`result` | [SliceResult](sliceresult.md) |

**Returns:** *void*

___

### `Optional` onSliceDispatch

▸ **onSliceDispatch**(`slice`: *[Slice](slice.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:105](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L105)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices disptached by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](slice.md) |

**Returns:** *void*

___

### `Optional` onSliceEnqueued

▸ **onSliceEnqueued**(`slice`: *[Slice](slice.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:99](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L99)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices enqueued by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](slice.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from [OperationLifeCycle](operationlifecycle.md).[shutdown](operationlifecycle.md#shutdown)*

*Defined in [interfaces/operation-lifecycle.ts:15](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/interfaces/operation-lifecycle.ts#L15)*

Called during execution shutdown,
when this is cleanup any open connections or destroy any in-memory state.

**Returns:** *`Promise<void>`*
