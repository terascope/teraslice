---
title: Job Components Interfaces Operation Lifecycle Sliceroperationlifecycle
sidebar_label: Interfaces Operation Lifecycle Sliceroperationlifecycle
---

> Interfaces Operation Lifecycle Sliceroperationlifecycle for @terascope/job-components

[Globals](../overview.md) / ["interfaces/operation-lifecycle"](../modules/_interfaces_operation_lifecycle_.md) / [SlicerOperationLifeCycle](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md) /

# Interface: SlicerOperationLifeCycle

## Hierarchy

* [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md)

  * **SlicerOperationLifeCycle**

## Implemented by

* [ParallelSlicer](../classes/_operations_parallel_slicer_.parallelslicer.md)
* [Slicer](../classes/_operations_slicer_.slicer.md)
* [SlicerCore](../classes/_operations_core_slicer_core_.slicercore.md)
* [SlicerExecutionContext](../classes/_execution_context_slicer_.slicerexecutioncontext.md)
* [TestSlicer](../classes/_builtin_test_reader_slicer_.testslicer.md)

### Index

#### Methods

* [initialize](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#initialize)
* [onExecutionStats](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#optional-onexecutionstats)
* [onSliceComplete](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#optional-onslicecomplete)
* [onSliceDispatch](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#optional-onslicedispatch)
* [onSliceEnqueued](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#optional-onsliceenqueued)
* [shutdown](_interfaces_operation_lifecycle_.sliceroperationlifecycle.md#shutdown)

## Methods

###  initialize

▸ **initialize**(`recoveryData?`: *object[]*): *`Promise<void>`*

*Overrides [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md).[initialize](_interfaces_operation_lifecycle_.operationlifecycle.md#initialize)*

*Defined in [interfaces/operation-lifecycle.ts:88](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L88)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData?` | object[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

### `Optional` onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](_interfaces_operations_.executionstats.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:112](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L112)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track various slicer satistics

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](_interfaces_operations_.executionstats.md) |

**Returns:** *void*

___

### `Optional` onSliceComplete

▸ **onSliceComplete**(`result`: *[SliceResult](_interfaces_operations_.sliceresult.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:106](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L106)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices completed by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`result` | [SliceResult](_interfaces_operations_.sliceresult.md) |

**Returns:** *void*

___

### `Optional` onSliceDispatch

▸ **onSliceDispatch**(`slice`: *[Slice](_interfaces_operations_.slice.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:100](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L100)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices disptached by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](_interfaces_operations_.slice.md) |

**Returns:** *void*

___

### `Optional` onSliceEnqueued

▸ **onSliceEnqueued**(`slice`: *[Slice](_interfaces_operations_.slice.md)*): *void*

*Defined in [interfaces/operation-lifecycle.ts:94](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L94)*

A method called by the "Execution Controller" to give a "Slicer"
the opportunity to track the slices enqueued by the execution controller

**Parameters:**

Name | Type |
------ | ------ |
`slice` | [Slice](_interfaces_operations_.slice.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Inherited from [OperationLifeCycle](_interfaces_operation_lifecycle_.operationlifecycle.md).[shutdown](_interfaces_operation_lifecycle_.operationlifecycle.md#shutdown)*

*Defined in [interfaces/operation-lifecycle.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/interfaces/operation-lifecycle.ts#L12)*

Called during execution shutdown

**Returns:** *`Promise<void>`*
