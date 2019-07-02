---
title: Job Components Operations Core Slicer Core Slicercore
sidebar_label: Operations Core Slicer Core Slicercore
---

> Operations Core Slicer Core Slicercore for @terascope/job-components

[Globals](../overview.md) / ["operations/core/slicer-core"](../modules/_operations_core_slicer_core_.md) / [SlicerCore](_operations_core_slicer_core_.slicercore.md) /

# Class: SlicerCore <**T**>

A base class for supporting "Slicers" that run on a "Execution Controller",
that supports the execution lifecycle events.
This class will likely not be used externally
since Teraslice only supports a few type varients.

**`see`** Core

## Type parameters

▪ **T**

## Hierarchy

* [Core](_operations_core_core_.core.md)‹*[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*›

  * **SlicerCore**

  * [Slicer](_operations_slicer_.slicer.md)

  * [ParallelSlicer](_operations_parallel_slicer_.parallelslicer.md)

## Implements

* [OperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](_operations_core_slicer_core_.slicercore.md#constructor)

#### Properties

* [context](_operations_core_slicer_core_.slicercore.md#context)
* [events](_operations_core_slicer_core_.slicercore.md#events)
* [executionConfig](_operations_core_slicer_core_.slicercore.md#executionconfig)
* [logger](_operations_core_slicer_core_.slicercore.md#logger)
* [opConfig](_operations_core_slicer_core_.slicercore.md#protected-opconfig)
* [recoveryData](_operations_core_slicer_core_.slicercore.md#protected-recoverydata)
* [stats](_operations_core_slicer_core_.slicercore.md#protected-stats)

#### Accessors

* [workersConnected](_operations_core_slicer_core_.slicercore.md#protected-workersconnected)

#### Methods

* [canComplete](_operations_core_slicer_core_.slicercore.md#protected-cancomplete)
* [createSlice](_operations_core_slicer_core_.slicercore.md#createslice)
* [getSlice](_operations_core_slicer_core_.slicercore.md#getslice)
* [getSlices](_operations_core_slicer_core_.slicercore.md#getslices)
* [handle](_operations_core_slicer_core_.slicercore.md#abstract-handle)
* [initialize](_operations_core_slicer_core_.slicercore.md#initialize)
* [isRecoverable](_operations_core_slicer_core_.slicercore.md#isrecoverable)
* [maxQueueLength](_operations_core_slicer_core_.slicercore.md#maxqueuelength)
* [onExecutionStats](_operations_core_slicer_core_.slicercore.md#onexecutionstats)
* [shutdown](_operations_core_slicer_core_.slicercore.md#shutdown)
* [sliceCount](_operations_core_slicer_core_.slicercore.md#slicecount)
* [slicers](_operations_core_slicer_core_.slicercore.md#abstract-slicers)

## Constructors

###  constructor

\+ **new SlicerCore**(`context`: *[WorkerContext](../interfaces/_interfaces_context_.workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md)*): *[SlicerCore](_operations_core_slicer_core_.slicercore.md)*

*Overrides [Core](_operations_core_core_.core.md).[constructor](_operations_core_core_.core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L26)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/_interfaces_context_.workercontext.md) |
`opConfig` | [OpConfig](../interfaces/_interfaces_jobs_.opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/_interfaces_jobs_.executionconfig.md) |

**Returns:** *[SlicerCore](_operations_core_slicer_core_.slicercore.md)*

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

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](_operations_core_core_.core.md).[logger](_operations_core_core_.core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L25)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Defined in [operations/core/slicer-core.ts:24](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L24)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/_interfaces_operations_.executionstats.md)*

*Defined in [operations/core/slicer-core.ts:23](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L23)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Defined in [operations/core/slicer-core.ts:156](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L156)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Defined in [operations/core/slicer-core.ts:152](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L152)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: *[Slice](../interfaces/_interfaces_operations_.slice.md) | [SliceRequest](../interfaces/_interfaces_operations_.slicerequest.md)*, `order`: *number*, `id`: *number*): *void*

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

*Defined in [operations/core/slicer-core.ts:101](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L101)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: *number*): *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

*Defined in [operations/core/slicer-core.ts:109](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L109)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/_interfaces_operations_.slice.md)[]*

___

### `Abstract` handle

▸ **handle**(): *`Promise<boolean>`*

*Defined in [operations/core/slicer-core.ts:72](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L72)*

A generic method called by the Teraslice framework to a give a "Slicer"
the ability to handle creating slices.

**Returns:** *`Promise<boolean>`*

a boolean depending on whether the slicer is done

___

###  initialize

▸ **initialize**(`recoveryData`: *object[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/_interfaces_operation_lifecycle_.sliceroperationlifecycle.md)*

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

*Defined in [operations/core/slicer-core.ts:134](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L134)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

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

*Overrides [Core](_operations_core_core_.core.md).[shutdown](_operations_core_core_.core.md#abstract-shutdown)*

*Defined in [operations/core/slicer-core.ts:63](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L63)*

**Returns:** *`Promise<void>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Defined in [operations/core/slicer-core.ts:127](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L127)*

The number of enqueued slices

**Returns:** *number*

___

### `Abstract` slicers

▸ **slicers**(): *number*

*Defined in [operations/core/slicer-core.ts:77](https://github.com/terascope/teraslice/tree/0c8b1cfadd6cd255811e506264906c5373f2ebea/packages/job-components/operations/core/slicer-core.ts#L77)*

Return the number of registered slicers

**Returns:** *number*
