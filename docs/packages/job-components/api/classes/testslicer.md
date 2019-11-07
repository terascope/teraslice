---
title: Job Components: `TestSlicer`
sidebar_label: TestSlicer
---

# Class: TestSlicer

## Hierarchy

  ↳ [Slicer](slicer.md)‹[TestReaderConfig](../interfaces/testreaderconfig.md)›

  ↳ **TestSlicer**

## Implements

* [OperationLifeCycle](../interfaces/operationlifecycle.md)
* [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)

## Index

### Constructors

* [constructor](testslicer.md#constructor)

### Properties

* [context](testslicer.md#context)
* [events](testslicer.md#events)
* [executionConfig](testslicer.md#executionconfig)
* [isFinished](testslicer.md#isfinished)
* [logger](testslicer.md#logger)
* [opConfig](testslicer.md#protected-opconfig)
* [order](testslicer.md#private-order)
* [position](testslicer.md#position)
* [recoveryData](testslicer.md#protected-recoverydata)
* [requests](testslicer.md#requests)
* [stats](testslicer.md#protected-stats)

### Accessors

* [workersConnected](testslicer.md#protected-workersconnected)

### Methods

* [canComplete](testslicer.md#protected-cancomplete)
* [createSlice](testslicer.md#createslice)
* [getSlice](testslicer.md#getslice)
* [getSlices](testslicer.md#getslices)
* [handle](testslicer.md#handle)
* [initialize](testslicer.md#initialize)
* [isRecoverable](testslicer.md#isrecoverable)
* [maxQueueLength](testslicer.md#maxqueuelength)
* [onExecutionStats](testslicer.md#onexecutionstats)
* [shutdown](testslicer.md#shutdown)
* [slice](testslicer.md#slice)
* [sliceCount](testslicer.md#slicecount)
* [slicers](testslicer.md#slicers)

## Constructors

###  constructor

\+ **new TestSlicer**(`context`: [WorkerContext](../interfaces/workercontext.md), `opConfig`: [OpConfig](../interfaces/opconfig.md) & [TestReaderConfig](../interfaces/testreaderconfig.md), `executionConfig`: [ExecutionConfig](../interfaces/executionconfig.md)): *[TestSlicer](testslicer.md)*

*Inherited from [SlicerCore](slicercore.md).[constructor](slicercore.md#constructor)*

*Overrides [Core](core.md).[constructor](core.md#constructor)*

*Defined in [operations/core/slicer-core.ts:32](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L32)*

**Parameters:**

Name | Type |
------ | ------ |
`context` | [WorkerContext](../interfaces/workercontext.md) |
`opConfig` | [OpConfig](../interfaces/opconfig.md) & [TestReaderConfig](../interfaces/testreaderconfig.md) |
`executionConfig` | [ExecutionConfig](../interfaces/executionconfig.md) |

**Returns:** *[TestSlicer](testslicer.md)*

## Properties

###  context

• **context**: *Readonly‹[WorkerContext](../interfaces/workercontext.md)›*

*Inherited from [Core](core.md).[context](core.md#context)*

*Defined in [operations/core/core.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L10)*

___

###  events

• **events**: *EventEmitter*

*Inherited from [Core](core.md).[events](core.md#events)*

*Defined in [operations/core/core.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L13)*

___

###  executionConfig

• **executionConfig**: *Readonly‹[ExecutionConfig](../interfaces/executionconfig.md)›*

*Inherited from [Core](core.md).[executionConfig](core.md#executionconfig)*

*Defined in [operations/core/core.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L11)*

___

###  isFinished

• **isFinished**: *boolean* = false

*Inherited from [Slicer](slicer.md).[isFinished](slicer.md#isfinished)*

*Defined in [operations/slicer.ts:16](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/slicer.ts#L16)*

___

###  logger

• **logger**: *Logger*

*Inherited from [Core](core.md).[logger](core.md#logger)*

*Defined in [operations/core/core.ts:12](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/core.ts#L12)*

___

### `Protected` opConfig

• **opConfig**: *Readonly‹[OpConfig](../interfaces/opconfig.md) & [TestReaderConfig](../interfaces/testreaderconfig.md)›*

*Inherited from [SlicerCore](slicercore.md).[opConfig](slicercore.md#protected-opconfig)*

*Defined in [operations/core/slicer-core.ts:31](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L31)*

___

### `Private` order

• **order**: *number* = 0

*Inherited from [Slicer](slicer.md).[order](slicer.md#private-order)*

*Defined in [operations/slicer.ts:14](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/slicer.ts#L14)*

___

###  position

• **position**: *number* = 0

*Defined in [builtin/test-reader/slicer.ts:11](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/test-reader/slicer.ts#L11)*

___

### `Protected` recoveryData

• **recoveryData**: *object[]*

*Inherited from [SlicerCore](slicercore.md).[recoveryData](slicercore.md#protected-recoverydata)*

*Defined in [operations/core/slicer-core.ts:30](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L30)*

___

###  requests

• **requests**: *object[]* =  []

*Defined in [builtin/test-reader/slicer.ts:10](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/test-reader/slicer.ts#L10)*

___

### `Protected` stats

• **stats**: *[ExecutionStats](../interfaces/executionstats.md)*

*Inherited from [SlicerCore](slicercore.md).[stats](slicercore.md#protected-stats)*

*Defined in [operations/core/slicer-core.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L29)*

## Accessors

### `Protected` workersConnected

• **get workersConnected**(): *number*

*Inherited from [SlicerCore](slicercore.md).[workersConnected](slicercore.md#protected-workersconnected)*

*Defined in [operations/core/slicer-core.ts:159](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L159)*

**Returns:** *number*

## Methods

### `Protected` canComplete

▸ **canComplete**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[canComplete](slicercore.md#protected-cancomplete)*

*Defined in [operations/core/slicer-core.ts:155](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L155)*

**Returns:** *boolean*

___

###  createSlice

▸ **createSlice**(`input`: [Slice](../interfaces/slice.md) | [SliceRequest](../interfaces/slicerequest.md), `order`: number, `id`: number): *void*

*Inherited from [SlicerCore](slicercore.md).[createSlice](slicercore.md#createslice)*

*Defined in [operations/core/slicer-core.ts:86](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L86)*

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

*Defined in [operations/core/slicer-core.ts:103](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L103)*

A method called by the "Execution Controller" to dequeue a created "Slice"

**Returns:** *[Slice](../interfaces/slice.md) | null*

___

###  getSlices

▸ **getSlices**(`max`: number): *[Slice](../interfaces/slice.md)[]*

*Inherited from [SlicerCore](slicercore.md).[getSlices](slicercore.md#getslices)*

*Defined in [operations/core/slicer-core.ts:112](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L112)*

A method called by the "Execution Controller" to dequeue many created slices

**Parameters:**

Name | Type |
------ | ------ |
`max` | number |

**Returns:** *[Slice](../interfaces/slice.md)[]*

___

###  handle

▸ **handle**(): *Promise‹boolean›*

*Inherited from [Slicer](slicer.md).[handle](slicer.md#handle)*

*Overrides [SlicerCore](slicercore.md).[handle](slicercore.md#abstract-handle)*

*Defined in [operations/slicer.ts:28](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/slicer.ts#L28)*

**Returns:** *Promise‹boolean›*

___

###  initialize

▸ **initialize**(`recoveryData`: [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[]): *Promise‹void›*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[initialize](slicercore.md#initialize)*

*Defined in [builtin/test-reader/slicer.ts:13](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/test-reader/slicer.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`recoveryData` | [SlicerRecoveryData](../interfaces/slicerrecoverydata.md)[] |

**Returns:** *Promise‹void›*

___

###  isRecoverable

▸ **isRecoverable**(): *boolean*

*Inherited from [SlicerCore](slicercore.md).[isRecoverable](slicercore.md#isrecoverable)*

*Defined in [operations/core/slicer-core.ts:137](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L137)*

Used to indicate whether this slicer is recoverable.

**Returns:** *boolean*

___

###  maxQueueLength

▸ **maxQueueLength**(): *number*

*Inherited from [SlicerCore](slicercore.md).[maxQueueLength](slicercore.md#maxqueuelength)*

*Defined in [operations/core/slicer-core.ts:147](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L147)*

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

*Defined in [operations/core/slicer-core.ts:151](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L151)*

**Parameters:**

Name | Type |
------ | ------ |
`stats` | [ExecutionStats](../interfaces/executionstats.md) |

**Returns:** *void*

___

###  shutdown

▸ **shutdown**(): *Promise‹void›*

*Implementation of [SlicerOperationLifeCycle](../interfaces/sliceroperationlifecycle.md)*

*Overrides [SlicerCore](slicercore.md).[shutdown](slicercore.md#shutdown)*

*Defined in [builtin/test-reader/slicer.ts:29](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/test-reader/slicer.ts#L29)*

**Returns:** *Promise‹void›*

___

###  slice

▸ **slice**(): *Promise‹null | object›*

*Overrides [Slicer](slicer.md).[slice](slicer.md#abstract-slice)*

*Defined in [builtin/test-reader/slicer.ts:34](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/builtin/test-reader/slicer.ts#L34)*

**Returns:** *Promise‹null | object›*

___

###  sliceCount

▸ **sliceCount**(): *number*

*Inherited from [SlicerCore](slicercore.md).[sliceCount](slicercore.md#slicecount)*

*Defined in [operations/core/slicer-core.ts:130](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/core/slicer-core.ts#L130)*

The number of enqueued slices

**Returns:** *number*

___

###  slicers

▸ **slicers**(): *number*

*Inherited from [Slicer](slicer.md).[slicers](slicer.md#slicers)*

*Overrides [SlicerCore](slicercore.md).[slicers](slicercore.md#abstract-slicers)*

*Defined in [operations/slicer.ts:24](https://github.com/terascope/teraslice/blob/d8feecc03/packages/job-components/src/operations/slicer.ts#L24)*

**Returns:** *number*
