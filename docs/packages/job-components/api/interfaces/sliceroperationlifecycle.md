---
title: Job Components :: SlicerOperationLifeCycle
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

▸ **initialize**(`recoveryData?`: *object[]*): *`Promise<void>`*

*Overrides [OperationLifeCycle](operationlifecycle.md).[initialize](operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:88](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L88)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

### `Optional` onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](executionstats.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:112](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L112)*

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

*Defined in [interfaces/operation-lifecycle.ts:106](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L106)*

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

*Defined in [interfaces/operation-lifecycle.ts:100](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L100)*

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

*Defined in [interfaces/operation-lifecycle.ts:94](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L94)*

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

*Defined in [interfaces/operation-lifecycle.ts:12](https://github.com/terascope/teraslice/blob/e7b0edd3/packages/job-components/src/interfaces/operation-lifecycle.ts#L12)*

Called during execution shutdown

**Returns:** *`Promise<void>`*
