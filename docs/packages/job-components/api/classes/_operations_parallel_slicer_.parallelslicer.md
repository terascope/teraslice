---
title: Job Components Operations Parallel Slicer Parallelslicer
sidebar_label: Operations Parallel Slicer Parallelslicer
---

> Operations Parallel Slicer Parallelslicer for @terascope/job-components

[Globals](../overview.md) / ["operations/parallel-slicer"](../modules/_operations_parallel_slicer_.md) / [ParallelSlicer](_operations_parallel_slicer_.parallelslicer.md) /

# Class: ParallelSlicer <**T**>

A varient of a "Slicer" for running a parallel stream of slicers.

**`see`** SlicerCore

## Type parameters

▪ **T**

## Hierarchy

  * [SlicerCore](_operations_core_slicer_core_.slicercore.md)‹*`T`*›

  * **ParallelSlicer**

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_parallel_slicer_.parallelslicer.md#constructor)

#### Properties

* [_slicers](_operations_parallel_slicer_.parallelslicer.md#protected-_slicers)
* [context](_operations_parallel_slicer_.parallelslicer.md#context)
* [events](_operations_parallel_slicer_.parallelslicer.md#events)
* [executionConfig](_operations_parallel_slicer_.parallelslicer.md#executionconfig)
* [logger](_operations_parallel_slicer_.parallelslicer.md#logger)
* [opConfig](_operations_parallel_slicer_.parallelslicer.md#protected-opconfig)
* [recoveryData](_operations_parallel_slicer_.parallelslicer.md#protected-recoverydata)
* [stats](_operations_parallel_slicer_.parallelslicer.md#protected-stats)

#### Accessors

* [isFinished](_operations_parallel_slicer_.parallelslicer.md#isfinished)
* [workersConnected](_operations_parallel_slicer_.parallelslicer.md#protected-workersconnected)

#### Methods

* [canComplete](_operations_parallel_slicer_.parallelslicer.md#protected-cancomplete)
* [createSlice](_operations_parallel_slicer_.parallelslicer.md#createslice)
* [getSlice](_operations_parallel_slicer_.parallelslicer.md#getslice)
* [getSlices](_operations_parallel_slicer_.parallelslicer.md#getslices)
* [handle](_operations_parallel_slicer_.parallelslicer.md#handle)
* [initialize](_operations_parallel_slicer_.parallelslicer.md#initialize)
* [isRecoverable](_operations_parallel_slicer_.parallelslicer.md#isrecoverable)
* [maxQueueLength](_operations_parallel_slicer_.parallelslicer.md#maxqueuelength)
* [newSlicer](_operations_parallel_slicer_.parallelslicer.md#abstract-newslicer)
* [onExecutionStats](_operations_parallel_slicer_.parallelslicer.md#onexecutionstats)
* [shutdown](_operations_parallel_slicer_.parallelslicer.md#shutdown)
* [sliceCount](_operations_parallel_slicer_.parallelslicer.md#slicecount)
* [slicers](_operations_parallel_slicer_.parallelslicer.md#slicers)

## Constructors

###  constructor

\+ **new ParallelSlicer**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[ParallelSlicer](_operations_parallel_slicer_.parallelslicer.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[constructor](_operations_core_slicer_core_.slicercore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`opConfig` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[ParallelSlicer](_operations_parallel_slicer_.parallelslicer.md)*

## Properties

### `Protected` _slicers

• **_slicers**: *`SlicerObj`[]* =  []

*Defined in [operations/parallel-slicer.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L11)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](_operations_core_core_.core.md).[context](_operations_core_core_.core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](_operations_core_core_.core.md).[events](_operations_core_core_.core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](_operations_core_core_.core.md).[executionConfig](_operations_core_core_.core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](_operations_core_core_.core.md).[logger](_operations_core_core_.core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[opConfig](_operations_core_slicer_core_.slicercore.md#protected-opconfig)*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L25)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[recoveryData](_operations_core_slicer_core_.slicercore.md#protected-recoverydata)*

*Defined in [operations/core/slicer-core.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L24)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[stats](_operations_core_slicer_core_.slicercore.md#protected-stats)*

*Defined in [operations/core/slicer-core.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L23)*

## Accessors

###  isFinished

• **get isFinished**(): *boolean*

*Defined in [operations/parallel-slicer.ts:67](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L67)*

**Returns:** *boolean*

___

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[workersConnected](_operations_core_slicer_core_.slicercore.md#protected-workersconnected)*

*Defined in [operations/core/slicer-core.ts:156](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L156)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[canComplete](_operations_core_slicer_core_.slicercore.md#protected-cancomplete)*

*Defined in [operations/core/slicer-core.ts:152](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L152)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: *[Slice](../interfaces/_interfaces_operations_.slice.md) | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*, `order`: *number*, `id`: *number*): *void*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[createSlice](_operations_core_slicer_core_.slicercore.md#createslice)*

*Defined in [operations/core/slicer-core.ts:84](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L84)*

Create a Slice object from a slice request.
In the case of recovery the "Slice" already has the required
This will be enqueued and dequeued by the "Execution Controller"

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | [Slice](../interfaces/_interfaces_operations_.slice.md) \| [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md) | - |
`order` | number | - |
`id` | number | 0 |

**Returns:** *void*

___

###  getSlice

▸ **getSlice**(): *[Slice](../interfaces/_interfaces_operations_.slice.md) | null*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[getSlice](_operations_core_slicer_core_.slicercore.md#getslice)*

*Defined in [operations/core/slicer-core.ts:101](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L101)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: *number*): *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[getSlices](_operations_core_slicer_core_.slicercore.md#getslices)*

*Defined in [operations/core/slicer-core.ts:109](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L109)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

___

###  handle

▸ **handle**(): *`Promise<boolean>`*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[handle](_operations_core_slicer_core_.slicercore.md#abstract-handle)*

*Defined in [operations/parallel-slicer.ts:56](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L56)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[initialize](_operations_core_slicer_core_.slicercore.md#initialize)*

*Defined in [operations/parallel-slicer.ts:17](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L17)*

Register the different Slicer instances

**`see`** SlicerCore#initialize

**Parameters:**

Name | Type |
------ | ------ |
`recoveryData` | object[] |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[isRecoverable](_operations_core_slicer_core_.slicercore.md#isrecoverable)*

*Defined in [operations/core/slicer-core.ts:134](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L134)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[maxQueueLength](_operations_core_slicer_core_.slicercore.md#maxqueuelength)*

*Defined in [operations/core/slicer-core.ts:144](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L144)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

### `Abstract` newSlicer

▸ **newSlicer**(): *`Promise<SlicerFn | undefined>`*

*Defined in [operations/parallel-slicer.ts:50](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L50)*

Called by {@link ParallelSlicer#handle} for every count of `slicers` in the ExecutionConfig

**Returns:** *`Promise<SlicerFn | undefined>`*

a function which will be called in parallel

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[onExecutionStats](_operations_core_slicer_core_.slicercore.md#onexecutionstats)*

*Defined in [operations/core/slicer-core.ts:148](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L148)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[shutdown](_operations_core_slicer_core_.slicercore.md#shutdown)*

*Defined in [operations/parallel-slicer.ts:41](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L41)*

Cleanup the slicers functions

**`see`** SlicerCore#shutdown

**Returns:** *`Promise<void>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[sliceCount](_operations_core_slicer_core_.slicercore.md#slicecount)*

*Defined in [operations/core/slicer-core.ts:127](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L127)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Overrides [SlicerCore](_operations_core_slicer_core_.slicercore.md).[slicers](_operations_core_slicer_core_.slicercore.md#abstract-slicers)*

*Defined in [operations/parallel-slicer.ts:52](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/parallel-slicer.ts#L52)*

**Returns:** *number*
