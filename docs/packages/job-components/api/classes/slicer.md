---
title: Job Components: `Slicer`
sidebar_label: Slicer
---

# Class: Slicer <**T**>

The simpliest form a "Slicer"

See [SlicerCore](slicercore.md)

## Type parameters

▪ **T**

## Hierarchy

  * [SlicerCore](slicercore.md)‹*`T`*›

  * **Slicer**

  * [TestSlicer](testslicer.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

### Index

#### Constructors

* [constructor](slicer.md#constructor)

#### Properties

* [context](slicer.md#context)
* [events](slicer.md#events)
* [executionConfig](slicer.md#executionconfig)
* [isFinished](slicer.md#isfinished)
* [logger](slicer.md#logger)
* [opConfig](slicer.md#protected-opconfig)
* [order](slicer.md#private-order)
* [recoveryData](slicer.md#protected-recoverydata)
* [stats](slicer.md#protected-stats)

#### Accessors

* [workersConnected](slicer.md#protected-workersconnected)

#### Methods

* [canComplete](slicer.md#protected-cancomplete)
* [createSlice](slicer.md#createslice)
* [getSlice](slicer.md#getslice)
* [getSlices](slicer.md#getslices)
* [handle](slicer.md#handle)
* [initialize](slicer.md#initialize)
* [isRecoverable](slicer.md#isrecoverable)
* [maxQueueLength](slicer.md#maxqueuelength)
* [onExecutionStats](slicer.md#onexecutionstats)
* [shutdown](slicer.md#shutdown)
* [slice](slicer.md#abstract-slice)
* [sliceCount](slicer.md#slicecount)
* [slicers](slicer.md#slicers)

## Constructors

###  constructor

\+ **new Slicer**(`context`: *[WorkerContext](../interfaces/workercontext.md)*, `opConfig`: *[OpConfig](../interfaces/opconfig.md) & `T`*, `executionConfig`: *[ExecutionConfig](../interfaces/executionconfig.md)*): *[Slicer](slicer.md)*

*Inherited from [SlicerCore](slicercore.md).[constructor](slicercore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L28)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & `T` |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[Slicer](slicer.md)*

## Properties

###  context

• **context**: *`Readonly<WorkerContext>`*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *`EventEmitter`*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *`Readonly<ExecutionConfig>`*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L11)*

___

###  isFinished

• **isFinished**: *boolean* = false

*Defined in [operations/slicer.ts:16](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/slicer.ts#L16)*

___

###  logger

• **logger**: *`Logger`*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *`Readonly<OpConfig & T>`*

*Inherited from [SlicerCore](slicercore.md).[opConfig](slicercore.md#protected-opconfig)*

*Defined in [operations/core/slicer-core.ts:27](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L27)*

___

### `Private` order

• **order**: *number* = 0

*Defined in [operations/slicer.ts:14](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/slicer.ts#L14)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](slicercore.md).[recoveryData](slicercore.md#protected-recoverydata)*

*Defined in [operations/core/slicer-core.ts:26](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L26)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Inherited from [SlicerCore](slicercore.md).[stats](slicercore.md#protected-stats)*

*Defined in [operations/core/slicer-core.ts:25](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L25)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](slicercore.md).[workersConnected](slicercore.md#protected-workersconnected)*

*Defined in [operations/core/slicer-core.ts:158](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L158)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[canComplete](slicercore.md#protected-cancomplete)*

*Defined in [operations/core/slicer-core.ts:154](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L154)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: *[Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md)*, `order`: *number*, `id`: *number*): *void*

*Inherited from [SlicerCore](slicercore.md).[createSlice](slicercore.md#createslice)*

*Defined in [operations/core/slicer-core.ts:86](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L86)*

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

*Defined in [operations/core/slicer-core.ts:103](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L103)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: *number*): *[Slice](../interfaces/slice.md)[]*

*Inherited from [SlicerCore](slicercore.md).[getSlices](slicercore.md#getslices)*

*Defined in [operations/core/slicer-core.ts:111](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L111)*

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

*Defined in [operations/slicer.ts:28](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/slicer.ts#L28)*

**Returns:** *`Promise<boolean>`*

___

###  initialize

▸ **initialize**(`recoveryData`: *[SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]*): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[initialize](slicercore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [operations/core/slicer-core.ts:60](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L60)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData` | [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[] | is the data to recover from  |

**Returns:** *`Promise<void>`*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[isRecoverable](slicercore.md#isrecoverable)*

*Defined in [operations/core/slicer-core.ts:136](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L136)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](slicercore.md).[maxQueueLength](slicercore.md#maxqueuelength)*

*Defined in [operations/core/slicer-core.ts:146](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L146)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: *[ExecutionStats](../interfaces/executionstats.md)*): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[onExecutionStats](slicercore.md#onexecutionstats)*

*Defined in [operations/core/slicer-core.ts:150](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L150)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *`Promise<void>`*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[shutdown](slicercore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [operations/core/slicer-core.ts:65](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L65)*

**Returns:** *`Promise<void>`*

___

### `Abstract` slice

▸ **slice**(): *`Promise<SlicerResult>`*

*Defined in [operations/slicer.ts:22](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/slicer.ts#L22)*

A method called by {@link Slicer#handle}

**Returns:** *`Promise<SlicerResult>`*

a Slice, or SliceRequest

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](slicercore.md).[sliceCount](slicercore.md#slicecount)*

*Defined in [operations/core/slicer-core.ts:129](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/core/slicer-core.ts#L129)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Overrides [SlicerCore](slicercore.md).[slicers](slicercore.md#abstract-slicers)*

*Defined in [operations/slicer.ts:24](https://github.com/terascope/teraslice/blob/a3992c27/packages/job-components/src/operations/slicer.ts#L24)*

**Returns:** *number*
