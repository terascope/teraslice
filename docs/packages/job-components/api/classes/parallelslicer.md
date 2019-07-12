---
title: Job Components: `ParallelSlicer`
sidebar_label: ParallelSlicer
---

# Class: ParallelSlicer <**T**>

A varient of a "Slicer" for running a parallel stream of slicers.

See [SlicerCore](slicercore.md) for more informartion

## Type parameters

▪ **T**

## Hierarchy

  * [SlicerCore](slicercore.md)‹*`T`*›

  * **ParallelSlicer**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](parallelslicer.md#constructor)

#### Properties

* [_slicers](parallelslicer.md#protected-_slicers)
* [context](parallelslicer.md#context)
* [events](parallelslicer.md#events)
* [executionConfig](parallelslicer.md#executionconfig)
* [logger](parallelslicer.md#logger)
* [opConfig](parallelslicer.md#protected-opconfig)
* [recoveryData](parallelslicer.md#protected-recoverydata)
* [stats](parallelslicer.md#protected-stats)

#### Accessors

* [isFinished](parallelslicer.md#isfinished)
* [workersConnected](parallelslicer.md#protected-workersconnected)

#### Methods

* [canComplete](parallelslicer.md#protected-cancomplete)
* [createSlice](parallelslicer.md#createslice)
* [getSlice](parallelslicer.md#getslice)
* [getSlices](parallelslicer.md#getslices)
* [handle](parallelslicer.md#handle)
* [initialize](parallelslicer.md#initialize)
* [isRecoverable](parallelslicer.md#isrecoverable)
* [maxQueueLength](parallelslicer.md#maxqueuelength)
* [newSlicer](parallelslicer.md#abstract-newslicer)
* [onExecutionStats](parallelslicer.md#onexecutionstats)
* [shutdown](parallelslicer.md#shutdown)
* [sliceCount](parallelslicer.md#slicecount)
* [slicers](parallelslicer.md#slicers)

## Constructors

###  constructor

\+ **new ParallelSlicer**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & `T`, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[ParallelSlicer](parallelslicer.md)*

*Inherited from [SlicerCore](slicercore.md).[constructor](slicercore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:28](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[ParallelSlicer](parallelslicer.md)*

## Properties

### `Protected` _slicers

• **_slicers**: *`SlicerObj`[]* =  []

*Defined in [operations/parallel-slicer.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L12)*

___

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [SlicerCore](slicercore.md).[opConfig](slicercore.md#protected-opconfig)*

*Defined in [operations/core/slicer-core.ts:27](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L27)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](slicercore.md).[recoveryData](slicercore.md#protected-recoverydata)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L26)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Inherited from [SlicerCore](slicercore.md).[stats](slicercore.md#protected-stats)*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L25)*

## Accessors

###  isFinished

• **get isFinished**(): *boolean*

*Defined in [operations/parallel-slicer.ts:68](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L68)*

**Returns:** *boolean*

___

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](slicercore.md).[workersConnected](slicercore.md#protected-workersconnected)*

*Defined in [operations/core/slicer-core.ts:158](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L158)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[canComplete](slicercore.md#protected-cancomplete)*

*Defined in [operations/core/slicer-core.ts:154](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L154)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: [Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md), `order`: number, `id`: number): *void*

*Inherited from [SlicerCore](slicercore.md).[createSlice](slicercore.md#createslice)*

*Defined in [operations/core/slicer-core.ts:86](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L86)*

Create a Slice object from a slice request.
In the case of recovery the "Slice" already has the required
This will be enqueued and dequeued by the "Execution Controller"

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | [Slice](../interfaces/slice.md) \| [SliceRequest](../interfaces/slicerequest.md) | - |
`order` | number | - |
`id` | number | 0 |

**Returns:** *void*

___

###  getSlice

▸ **getSlice**(): *[Slice](../interfaces/slice.md) | null*

*Inherited from [SlicerCore](slicercore.md).[getSlice](slicercore.md#getslice)*

*Defined in [operations/core/slicer-core.ts:103](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L103)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: number): *[Slice](../interfaces/slice.md)[]*

*Inherited from [SlicerCore](slicercore.md).[getSlices](slicercore.md#getslices)*

*Defined in [operations/core/slicer-core.ts:111](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L111)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/slice.md)[]*

___

###  handle

▸ **handle**(): *`Promise<boolean>`*

*Overrides [SlicerCore](slicercore.md).[handle](slicercore.md#abstract-handle)*

*Defined in [operations/parallel-slicer.ts:59](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L59)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[initialize](slicercore.md#initialize)*

*Defined in [operations/parallel-slicer.ts:19](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L19)*

Register the different Slicer instances

See [[SlicerCore#initialize]]

**Parameters:**

Name | Type |
------ | ------ |
`recoveryData` | [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[] |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[isRecoverable](slicercore.md#isrecoverable)*

*Defined in [operations/core/slicer-core.ts:136](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L136)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](slicercore.md).[maxQueueLength](slicercore.md#maxqueuelength)*

*Defined in [operations/core/slicer-core.ts:146](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L146)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

### `Abstract` newSlicer

▸ **newSlicer**(`id`: number): *`Promise<SlicerFn | undefined>`*

*Defined in [operations/parallel-slicer.ts:53](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L53)*

Called by {@link ParallelSlicer#handle} for every count of `slicers` in the ExecutionConfig

**Parameters:**

Name | Type |
------ | ------ |
`id` | number |

**Returns:** *`Promise<SlicerFn | undefined>`*

a function which will be called in parallel

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: [ExecutionStats](../interfaces/executionstats.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[onExecutionStats](slicercore.md#onexecutionstats)*

*Defined in [operations/core/slicer-core.ts:150](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[shutdown](slicercore.md#shutdown)*

*Defined in [operations/parallel-slicer.ts:44](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L44)*

Cleanup the slicers functions

See [[SlicerCore#shutdown]]

**Returns:** *`Promise<void>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](slicercore.md).[sliceCount](slicercore.md#slicecount)*

*Defined in [operations/core/slicer-core.ts:129](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/core/slicer-core.ts#L129)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Overrides [SlicerCore](slicercore.md).[slicers](slicercore.md#abstract-slicers)*

*Defined in [operations/parallel-slicer.ts:55](https://github.com/terascope/teraslice/blob/6aab1cd2/packages/job-components/src/operations/parallel-slicer.ts#L55)*

**Returns:** *number*
