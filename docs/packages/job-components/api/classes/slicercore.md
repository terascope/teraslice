---
title: Job Components: `SlicerCore`
sidebar_label: SlicerCore
---

# Class: SlicerCore <**T**>

A base class for supporting "Slicers" that run on a "Execution Controller",
that supports the execution lifecycle events.
This class will likely not be used externally
since Teraslice only supports a few type varients.

See [Core](core.md) for more information

## Type parameters

▪ **T**

## Hierarchy

* [Core](core.md)‹*[WorkerContext](../interfaces/workercontext.md)*›

  * **SlicerCore**

  * [Slicer](slicer.md)

  * [ParallelSlicer](parallelslicer.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

## Index

### Constructors

* [constructor](slicercore.md#constructor)

### Properties

* [context](slicercore.md#context)
* [events](slicercore.md#events)
* [executionConfig](slicercore.md#executionconfig)
* [logger](slicercore.md#logger)
* [opConfig](slicercore.md#protected-opconfig)
* [recoveryData](slicercore.md#protected-recoverydata)
* [stats](slicercore.md#protected-stats)

### Accessors

* [workersConnected](slicercore.md#protected-workersconnected)

### Methods

* [canComplete](slicercore.md#protected-cancomplete)
* [createSlice](slicercore.md#createslice)
* [getSlice](slicercore.md#getslice)
* [getSlices](slicercore.md#getslices)
* [handle](slicercore.md#abstract-handle)
* [initialize](slicercore.md#initialize)
* [isRecoverable](slicercore.md#isrecoverable)
* [maxQueueLength](slicercore.md#maxqueuelength)
* [onExecutionStats](slicercore.md#onexecutionstats)
* [shutdown](slicercore.md#shutdown)
* [sliceCount](slicercore.md#slicecount)
* [slicers](slicercore.md#abstract-slicers)

## Constructors

###  constructor

\+ **new SlicerCore**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & `T`, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[SlicerCore](slicercore.md)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:28](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[SlicerCore](slicercore.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/core.ts#L11)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Defined in [operations/core/slicer-core.ts:27](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L27)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L26)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L25)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Defined in [operations/core/slicer-core.ts:158](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L158)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Defined in [operations/core/slicer-core.ts:154](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L154)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: [Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md), `order`: number, `id`: number): *void*

*Defined in [operations/core/slicer-core.ts:86](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L86)*

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

*Defined in [operations/core/slicer-core.ts:103](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L103)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: number): *[Slice](../interfaces/slice.md)[]*

*Defined in [operations/core/slicer-core.ts:111](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L111)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/slice.md)[]*

___

### `Abstract` handle

▸ **handle**(): *`Promise<boolean>`*

*Defined in [operations/core/slicer-core.ts:74](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L74)*

A generic method called by the Teraslice framework to a give a "Slicer"
the ability to handle creating slices.

**Returns:** *`Promise<boolean>`*

a boolean depending on whether the slicer is done

___

###  initialize

▸ **initialize**(`recoveryData`: [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/slicer-core.ts:60](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L60)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData` | [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Defined in [operations/core/slicer-core.ts:136](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L136)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Defined in [operations/core/slicer-core.ts:146](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L146)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: [ExecutionStats](../interfaces/executionstats.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Defined in [operations/core/slicer-core.ts:150](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/slicer-core.ts:65](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L65)*

**Returns:** *`Promise<void>`*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Defined in [operations/core/slicer-core.ts:129](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L129)*

The number of enqueued slices

**Returns:** *number*

___

### `Abstract` slicers

▸ **slicers**(): *number*

*Defined in [operations/core/slicer-core.ts:79](https://github.com/terascope/teraslice/blob/fd211a8bb/packages/job-components/src/operations/core/slicer-core.ts#L79)*

Return the number of registered slicers

**Returns:** *number*
