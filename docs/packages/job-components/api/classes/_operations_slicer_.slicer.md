---
title: Job Components Operations Slicer Slicer
sidebar_label: Operations Slicer Slicer
---

> Operations Slicer Slicer for @terascope/job-components

[Globals](../overview.md) / ["operations/slicer"](../modules/_operations_slicer_.md) / [Slicer](_operations_slicer_.slicer.md) /

# Class: Slicer <**T**>

The simpliest form a "Slicer"

**`see`** SlicerCore

## Type parameters

▪ **T**

## Hierarchy

  * [SlicerCore](_operations_core_slicer_core_.slicercore.md)‹*`T`*›

  * **Slicer**

  * [TestSlicer](_builtin_test_reader_slicer_.testslicer.md)

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_slicer_.slicer.md#constructor)

#### Properties

* [context](_operations_slicer_.slicer.md#context)
* [events](_operations_slicer_.slicer.md#events)
* [executionConfig](_operations_slicer_.slicer.md#executionconfig)
* [isFinished](_operations_slicer_.slicer.md#isfinished)
* [logger](_operations_slicer_.slicer.md#logger)
* [opConfig](_operations_slicer_.slicer.md#protected-opconfig)
* [order](_operations_slicer_.slicer.md#private-order)
* [recoveryData](_operations_slicer_.slicer.md#protected-recoverydata)
* [stats](_operations_slicer_.slicer.md#protected-stats)

#### Accessors

* [workersConnected](_operations_slicer_.slicer.md#protected-workersconnected)

#### Methods

* [canComplete](_operations_slicer_.slicer.md#protected-cancomplete)
* [createSlice](_operations_slicer_.slicer.md#createslice)
* [getSlice](_operations_slicer_.slicer.md#getslice)
* [getSlices](_operations_slicer_.slicer.md#getslices)
* [handle](_operations_slicer_.slicer.md#handle)
* [initialize](_operations_slicer_.slicer.md#initialize)
* [isRecoverable](_operations_slicer_.slicer.md#isrecoverable)
* [maxQueueLength](_operations_slicer_.slicer.md#maxqueuelength)
* [onExecutionStats](_operations_slicer_.slicer.md#onexecutionstats)
* [shutdown](_operations_slicer_.slicer.md#shutdown)
* [slice](_operations_slicer_.slicer.md#abstract-slice)
* [sliceCount](_operations_slicer_.slicer.md#slicecount)
* [slicers](_operations_slicer_.slicer.md#slicers)

## Constructors

###  constructor

\+ **new Slicer**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[Slicer](_operations_slicer_.slicer.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[constructor](_operations_core_slicer_core_.slicercore.md#constructor)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`opConfig` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[Slicer](_operations_slicer_.slicer.md)*

## Properties

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

###  isFinished

• **isFinished**: *boolean* = false

*Defined in [operations/slicer.ts:15](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L15)*

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

### `Private` order

• **order**: *number* = 0

*Defined in [operations/slicer.ts:13](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L13)*

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

*Defined in [operations/slicer.ts:27](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L27)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[initialize](_operations_core_slicer_core_.slicercore.md#initialize)*

*Overrides [Core](_operations_core_core_.core.md).[initialize](_operations_core_core_.core.md#abstract-initialize)*

*Defined in [operations/core/slicer-core.ts:58](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L58)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData` | object[] | is the data to recover from  |

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

*Inherited from [SlicerCore](_operations_core_slicer_core_.slicercore.md).[shutdown](_operations_core_slicer_core_.slicercore.md#shutdown)*

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/slicer-core.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L63)*

**Returns:** *`Promise<void>`*

___

### `Abstract` slice

▸ **slice**(): *`Promise<SlicerResult>`*

*Defined in [operations/slicer.ts:21](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L21)*

A method called by {@link Slicer#handle}

**Returns:** *`Promise<SlicerResult>`*

a Slice, or SliceRequest

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

*Defined in [operations/slicer.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/slicer.ts#L23)*

**Returns:** *number*
