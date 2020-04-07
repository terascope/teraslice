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

  ↳ [SlicerCore](slicercore.md)‹T›

  ↳ **Slicer**

  ↳ [TestSlicer](testslicer.md)

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

## Index

### Constructors

* [constructor](slicer.md#constructor)

### Properties

* [context](slicer.md#context)
* [events](slicer.md#events)
* [executionConfig](slicer.md#executionconfig)
* [isFinished](slicer.md#isfinished)
* [logger](slicer.md#logger)
* [opConfig](slicer.md#protected-opconfig)
* [order](slicer.md#private-order)
* [recoveryData](slicer.md#protected-recoverydata)
* [stats](slicer.md#protected-stats)

### Accessors

* [workersConnected](slicer.md#protected-workersconnected)

### Methods

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

\+ **new Slicer**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & T, `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[Slicer](slicer.md)*

*Inherited from [SlicerCore](slicercore.md).[constructor](slicercore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:34](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & T |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[Slicer](slicer.md)*

## Properties

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [packages/job-components/src/operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [packages/job-components/src/operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [packages/job-components/src/operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L11)*

___

###  isFinished

• **isFinished**: *boolean* = false

*Defined in [packages/job-components/src/operations/slicer.ts:16](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/slicer.ts#L16)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [packages/job-components/src/operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *Readonly‹[OpConfig](../interfaces/opconfig.md) & T›*

*Inherited from [SlicerCore](slicercore.md).[opConfig](slicercore.md#protected-opconfig)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:33](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L33)*

___

### `Private` order

• **order**: *number* = 0

*Defined in [packages/job-components/src/operations/slicer.ts:14](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/slicer.ts#L14)*

___

### `Protected` recoveryData

• **recoveryData**: *[SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]*

*Inherited from [SlicerCore](slicercore.md).[recoveryData](slicercore.md#protected-recoverydata)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:32](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L32)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Inherited from [SlicerCore](slicercore.md).[stats](slicercore.md#protected-stats)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:31](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L31)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](slicercore.md).[workersConnected](slicercore.md#protected-workersconnected)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:160](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L160)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[canComplete](slicercore.md#protected-cancomplete)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:156](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L156)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: [Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md), `order`: number, `id`: number): *void*

*Inherited from [SlicerCore](slicercore.md).[createSlice](slicercore.md#createslice)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:87](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L87)*

Create a Slice object from a slice request.
In the case of recovery the "Slice" already has the required
This will be enqueued and dequeued by the "Execution Controller"

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`input` | [Slice](../interfaces/slice.md) &#124; [SliceRequest](../interfaces/slicerequest.md) | - |
`order` | number | - |
`id` | number | 0 |

**Returns:** *void*

___

###  getSlice

▸ **getSlice**(): *[Slice](../interfaces/slice.md) | null*

*Inherited from [SlicerCore](slicercore.md).[getSlice](slicercore.md#getslice)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:104](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L104)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: number): *[Slice](../interfaces/slice.md)[]*

*Inherited from [SlicerCore](slicercore.md).[getSlices](slicercore.md#getslices)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:113](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L113)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/slice.md)[]*

___

###  handle

▸ **handle**(): *Promise‹boolean›*

*Overrides [SlicerCore](slicercore.md).[handle](slicercore.md#abstract-handle)*

*Defined in [packages/job-components/src/operations/slicer.ts:28](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/slicer.ts#L28)*

**Returns:** *Promise‹boolean›*

___

###  initialize

▸ **initialize**(`recoveryData`: [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]): *Promise‹void›*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[initialize](slicercore.md#initialize)*

*Overrides [Core](core.md).[initialize](core.md#abstract-initialize)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:61](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L61)*

Called during execution initialization

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`recoveryData` | [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[] | is the data to recover from  |

**Returns:** *Promise‹void›*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[isRecoverable](slicercore.md#isrecoverable)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:138](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L138)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](slicercore.md).[maxQueueLength](slicercore.md#maxqueuelength)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:148](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L148)*

Used to determine the maximum number of slices queued.
Defaults to 10000
NOTE: if you want to base of the number of
workers use {@link #workersConnected}

**Returns:** *number*

___

###  onExecutionStats

▸ **onExecutionStats**(`stats`: [ExecutionStats](../interfaces/executionstats.md)): *void*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[onExecutionStats](slicercore.md#onexecutionstats)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:152](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L152)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Inherited from [SlicerCore](slicercore.md).[shutdown](slicercore.md#shutdown)*

*Overrides [Core](core.md).[shutdown](core.md#abstract-shutdown)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:66](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L66)*

**Returns:** *Promise‹void›*

___

### `Abstract` slice

▸ **slice**(): *Promise‹[SlicerResult](../overview.md#slicerresult)›*

*Defined in [packages/job-components/src/operations/slicer.ts:22](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/slicer.ts#L22)*

A method called by {@link Slicer#handle}

**Returns:** *Promise‹[SlicerResult](../overview.md#slicerresult)›*

a Slice, or SliceRequest

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](slicercore.md).[sliceCount](slicercore.md#slicecount)*

*Defined in [packages/job-components/src/operations/core/slicer-core.ts:131](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/core/slicer-core.ts#L131)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Overrides [SlicerCore](slicercore.md).[slicers](slicercore.md#abstract-slicers)*

*Defined in [packages/job-components/src/operations/slicer.ts:24](https://github.com/terascope/teraslice/blob/f95bb5556/packages/job-components/src/operations/slicer.ts#L24)*

**Returns:** *number*
